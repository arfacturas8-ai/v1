import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import apiService from '../../services/RealApiService';
import PostCard from './PostCard';
import CommentThread from './CommentThread';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  isOnline?: boolean;
  lastSeen?: string;
  karma: {
    post: number;
    comment: number;
    total: number;
  };
  trophies: Trophy[];
  following?: boolean;
  blocked?: boolean;
}

interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
}

interface UserProfileProps {
  userId: string;
  onClose?: () => void;
}

type ContentType = 'overview' | 'posts' | 'comments' | 'saved' | 'trophies';

const { width: screenWidth } = Dimensions.get('window');

export default function UserProfile({ userId, onClose }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('overview');
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [karmaHistory, setKarmaHistory] = useState<any[]>([]);
  const [showTrophyModal, setShowTrophyModal] = useState(false);
  const [selectedTrophy, setSelectedTrophy] = useState<Trophy | null>(null);

  // Load user data
  const loadUser = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load user profile and current user in parallel
      const [userResponse, currentUserResponse] = await Promise.all([
        apiService.getUserProfile(userId),
        apiService.getCurrentUser(),
      ]);

      if (userResponse) {
        // Get karma data
        const karmaResponse = await apiService.getUserKarma(userId);
        // Get trophies
        const trophiesResponse = await apiService.getTrophies(userId);

        setUser({
          ...userResponse,
          karma: karmaResponse?.karma || { post: 0, comment: 0, total: 0 },
          trophies: trophiesResponse?.trophies || [],
        });
      }

      if (currentUserResponse) {
        setCurrentUser(currentUserResponse);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      Alert.alert('Error', 'Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Load content based on type
  const loadContent = useCallback(async (type: ContentType) => {
    if (type === 'overview' || type === 'trophies') return;
    
    setLoadingContent(true);
    try {
      switch (type) {
        case 'posts':
          const postsResponse = await apiService.getUserPosts(userId, 'posts');
          setPosts(postsResponse?.posts || []);
          break;
          
        case 'comments':
          const commentsResponse = await apiService.getUserPosts(userId, 'comments');
          setComments(commentsResponse?.comments || []);
          break;
          
        case 'saved':
          if (userId === currentUser?.id) {
            const savedResponse = await apiService.getSavedPosts();
            setSavedPosts(savedResponse?.posts || []);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
    } finally {
      setLoadingContent(false);
    }
  }, [userId, currentUser]);

  // Load karma history
  const loadKarmaHistory = useCallback(async () => {
    try {
      if (userId === currentUser?.id) {
        const response = await apiService.getKarmaHistory();
        setKarmaHistory(response?.history || []);
      }
    } catch (error) {
      console.error('Failed to load karma history:', error);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    loadUser();
    loadKarmaHistory();
  }, [loadUser, loadKarmaHistory]);

  useEffect(() => {
    loadContent(contentType);
  }, [contentType, loadContent]);

  // Handle follow/unfollow
  const handleFollow = useCallback(async () => {
    if (!user) return;
    
    try {
      if (user.following) {
        await apiService.unfollowUser(userId);
        setUser(prev => prev ? { ...prev, following: false } : null);
      } else {
        await apiService.followUser(userId);
        setUser(prev => prev ? { ...prev, following: true } : null);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  }, [user, userId]);

  // Handle block/unblock
  const handleBlock = useCallback(() => {
    if (!user) return;
    
    Alert.alert(
      user.blocked ? 'Unblock User' : 'Block User',
      user.blocked 
        ? `Are you sure you want to unblock u/${user.username}?`
        : `Are you sure you want to block u/${user.username}? You won't see their posts or comments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.blocked ? 'Unblock' : 'Block',
          style: user.blocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (user.blocked) {
                await apiService.unblockUser(userId);
                setUser(prev => prev ? { ...prev, blocked: false } : null);
              } else {
                await apiService.blockUser(userId, 'User requested block');
                setUser(prev => prev ? { ...prev, blocked: true } : null);
              }
            } catch (error) {
              console.error('Failed to block/unblock user:', error);
              Alert.alert('Error', 'Failed to update block status. Please try again.');
            }
          },
        },
      ]
    );
  }, [user, userId]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (!user) return;
    
    Alert.alert(
      'Send Message',
      `Send a direct message to u/${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            // Navigate to chat screen
            console.log('Navigate to chat with user:', userId);
          },
        },
      ]
    );
  }, [user, userId]);

  // Handle trophy press
  const handleTrophyPress = useCallback((trophy: Trophy) => {
    setSelectedTrophy(trophy);
    setShowTrophyModal(true);
  }, []);

  // Get trophy color based on rarity
  const getTrophyColor = useCallback((rarity: string) => {
    switch (rarity) {
      case 'common': return '#CD7F32';
      case 'rare': return '#C0C0C0';
      case 'epic': return '#FFD700';
      case 'legendary': return '#FF6B6B';
      default: return '#999';
    }
  }, []);

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        
        <View style={styles.profileInfo}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {user?.username.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          
          <Text style={styles.username}>u/{user?.username}</Text>
          
          {user?.bio && (
            <Text style={styles.bio}>{user.bio}</Text>
          )}
          
          <View style={styles.userMeta}>
            <Text style={styles.joinDate}>
              Joined {format(new Date(user?.createdAt || Date.now()), 'MMM d, yyyy')}
            </Text>
            {user?.isOnline && (
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}
          </View>
        </View>

        {/* Karma display */}
        <View style={styles.karmaContainer}>
          <View style={styles.karmaItem}>
            <Text style={styles.karmaValue}>{user?.karma.post.toLocaleString() || '0'}</Text>
            <Text style={styles.karmaLabel}>Post Karma</Text>
          </View>
          <View style={styles.karmaItem}>
            <Text style={styles.karmaValue}>{user?.karma.comment.toLocaleString() || '0'}</Text>
            <Text style={styles.karmaLabel}>Comment Karma</Text>
          </View>
          <View style={styles.karmaItem}>
            <Text style={styles.karmaValue}>{user?.karma.total.toLocaleString() || '0'}</Text>
            <Text style={styles.karmaLabel}>Total Karma</Text>
          </View>
        </View>

        {/* Action buttons */}
        {userId !== currentUser?.id && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.followButton]}
              onPress={handleFollow}
            >
              <Ionicons 
                name={user?.following ? 'person-remove' : 'person-add'} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {user?.following ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleSendMessage}
            >
              <Ionicons name="mail" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.blockButton]}
              onPress={handleBlock}
            >
              <Ionicons 
                name={user?.blocked ? 'checkmark-circle' : 'ban'} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {user?.blocked ? 'Unblock' : 'Block'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  // Render content tabs
  const renderContentTabs = () => {
    const tabs = [
      { key: 'overview', label: 'Overview', icon: 'person' },
      { key: 'posts', label: 'Posts', icon: 'document-text' },
      { key: 'comments', label: 'Comments', icon: 'chatbubbles' },
      { key: 'trophies', label: 'Trophies', icon: 'trophy' },
    ];

    if (userId === currentUser?.id) {
      tabs.splice(3, 0, { key: 'saved', label: 'Saved', icon: 'bookmark' });
    }

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              contentType === tab.key && styles.activeTab,
            ]}
            onPress={() => setContentType(tab.key as ContentType)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={contentType === tab.key ? '#007AFF' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                contentType === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render overview content
  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      {/* Trophy showcase */}
      <View style={styles.trophyShowcase}>
        <Text style={styles.sectionTitle}>Recent Trophies</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.trophyList}>
            {user?.trophies.slice(0, 5).map(trophy => (
              <TouchableOpacity
                key={trophy.id}
                style={styles.trophyItem}
                onPress={() => handleTrophyPress(trophy)}
              >
                <View 
                  style={[
                    styles.trophyIcon, 
                    { backgroundColor: getTrophyColor(trophy.rarity) }
                  ]}
                >
                  <Text style={styles.trophyEmoji}>{trophy.icon}</Text>
                </View>
                <Text style={styles.trophyName} numberOfLines={1}>
                  {trophy.name}
                </Text>
              </TouchableOpacity>
            ))}
            {user?.trophies.length === 0 && (
              <Text style={styles.emptyText}>No trophies yet</Text>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Recent activity */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {/* This would show recent posts/comments */}
        <Text style={styles.emptyText}>Recent activity will appear here</Text>
      </View>
    </View>
  );

  // Render trophies
  const renderTrophies = () => (
    <View style={styles.trophiesContainer}>
      {user?.trophies.map(trophy => (
        <TouchableOpacity
          key={trophy.id}
          style={styles.fullTrophyItem}
          onPress={() => handleTrophyPress(trophy)}
        >
          <View 
            style={[
              styles.fullTrophyIcon, 
              { backgroundColor: getTrophyColor(trophy.rarity) }
            ]}
          >
            <Text style={styles.fullTrophyEmoji}>{trophy.icon}</Text>
          </View>
          <View style={styles.fullTrophyDetails}>
            <Text style={styles.fullTrophyName}>{trophy.name}</Text>
            <Text style={styles.fullTrophyDescription} numberOfLines={2}>
              {trophy.description}
            </Text>
            <Text style={styles.fullTrophyDate}>
              Earned {format(new Date(trophy.earnedAt), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={[styles.rarityBadge, { borderColor: getTrophyColor(trophy.rarity) }]}>
            <Text style={[styles.rarityText, { color: getTrophyColor(trophy.rarity) }]}>
              {trophy.rarity.toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      
      {user?.trophies.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={48} color="#999" />
          <Text style={styles.emptyTitle}>No Trophies</Text>
          <Text style={styles.emptySubtext}>
            Earn trophies by participating in the community!
          </Text>
        </View>
      )}
    </View>
  );

  // Render trophy modal
  const renderTrophyModal = () => (
    <Modal
      visible={showTrophyModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTrophyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.trophyModal}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowTrophyModal(false)}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          
          {selectedTrophy && (
            <View style={styles.trophyModalContent}>
              <View 
                style={[
                  styles.modalTrophyIcon, 
                  { backgroundColor: getTrophyColor(selectedTrophy.rarity) }
                ]}
              >
                <Text style={styles.modalTrophyEmoji}>{selectedTrophy.icon}</Text>
              </View>
              
              <Text style={styles.modalTrophyName}>{selectedTrophy.name}</Text>
              
              <View style={[styles.modalRarityBadge, { backgroundColor: getTrophyColor(selectedTrophy.rarity) }]}>
                <Text style={styles.modalRarityText}>
                  {selectedTrophy.rarity.toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.modalTrophyDescription}>
                {selectedTrophy.description}
              </Text>
              
              <Text style={styles.modalTrophyDate}>
                Earned on {format(new Date(selectedTrophy.earnedAt), 'MMMM d, yyyy')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render content based on type
  const renderContent = () => {
    if (loadingContent) {
      return null;
    }

    switch (contentType) {
      case 'overview':
        return renderOverview();
      case 'posts':
        return (
          <ScrollView>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onVote={() => {}}
                onSave={() => {}}
                onShare={() => {}}
                onReport={() => {}}
                onPress={() => {}}
              />
            ))}
            {posts.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#999" />
                <Text style={styles.emptyTitle}>No Posts</Text>
                <Text style={styles.emptySubtext}>This user hasn't posted anything yet.</Text>
              </View>
            )}
          </ScrollView>
        );
      case 'comments':
        return (
          <ScrollView>
            {comments.map(comment => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onVote={() => {}}
                onReply={() => {}}
              />
            ))}
            {comments.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#999" />
                <Text style={styles.emptyTitle}>No Comments</Text>
                <Text style={styles.emptySubtext}>This user hasn't commented yet.</Text>
              </View>
            )}
          </ScrollView>
        );
      case 'saved':
        return (
          <ScrollView>
            {savedPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onVote={() => {}}
                onSave={() => {}}
                onShare={() => {}}
                onReport={() => {}}
                onPress={() => {}}
              />
            ))}
            {savedPosts.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={48} color="#999" />
                <Text style={styles.emptyTitle}>No Saved Posts</Text>
                <Text style={styles.emptySubtext}>Save interesting posts to view them here.</Text>
              </View>
            )}
          </ScrollView>
        );
      case 'trophies':
        return renderTrophies();
      default:
        return null;
    }
  };

  if (loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadUser(true)}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderContentTabs()}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </ScrollView>
      {renderTrophyModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: spacing.sm,
  },
  headerGradient: {
    padding: spacing.xl,
    paddingTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: '#fff',
  },
  username: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  bio: {
    fontSize: typography.body1,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinDate: {
    fontSize: typography.body2,
    color: '#fff',
    opacity: 0.8,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C851',
    marginRight: spacing.xs,
  },
  onlineText: {
    fontSize: typography.body2,
    color: '#fff',
    opacity: 0.8,
  },
  karmaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
  },
  karmaItem: {
    alignItems: 'center',
  },
  karmaValue: {
    fontSize: typography.h5,
    fontWeight: '600',
    color: '#fff',
  },
  karmaLabel: {
    fontSize: typography.caption,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    minWidth: 80,
  },
  followButton: {
    backgroundColor: '#007AFF',
  },
  messageButton: {
    backgroundColor: '#00C851',
  },
  blockButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabContentContainer: {
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
  },
  tabText: {
    fontSize: typography.body2,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: typography.body1,
    color: '#666',
    marginTop: spacing.md,
  },
  overviewContainer: {
    padding: spacing.lg,
  },
  trophyShowcase: {
    backgroundColor: '#fff',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.md,
  },
  trophyList: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  trophyItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
    width: 80,
  },
  trophyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  trophyEmoji: {
    fontSize: typography.h4,
  },
  trophyName: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  activitySection: {
    backgroundColor: '#fff',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: typography.body2,
    color: '#666',
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#333',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.body2,
    color: '#666',
    textAlign: 'center',
  },
  trophiesContainer: {
    padding: spacing.lg,
  },
  fullTrophyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  fullTrophyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  fullTrophyEmoji: {
    fontSize: typography.h3,
  },
  fullTrophyDetails: {
    flex: 1,
  },
  fullTrophyName: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.xs,
  },
  fullTrophyDescription: {
    fontSize: typography.body2,
    color: '#666',
    marginBottom: spacing.xs,
  },
  fullTrophyDate: {
    fontSize: typography.caption,
    color: '#999',
  },
  rarityBadge: {
    borderWidth: 1,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.xxl,
    marginHorizontal: spacing.xl,
    maxWidth: screenWidth - 40,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: spacing.xs,
  },
  trophyModalContent: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  modalTrophyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalTrophyEmoji: {
    fontSize: 40,
  },
  modalTrophyName: {
    fontSize: typography.h5,
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalRarityBadge: {
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.lg,
  },
  modalRarityText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: '#fff',
  },
  modalTrophyDescription: {
    fontSize: typography.body1,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  modalTrophyDate: {
    fontSize: typography.body2,
    color: '#999',
  },
});