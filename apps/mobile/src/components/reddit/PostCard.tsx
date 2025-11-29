import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanGestureHandler,
  State,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
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

interface PostCardProps {
  post: Post;
  onVote: (postId: string, voteType: 'up' | 'down') => void;
  onSave: (postId: string, save: boolean) => void;
  onShare: (post: Post) => void;
  onReport: (postId: string) => void;
  onPress: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;
const VOTE_THRESHOLD = 80;

export default function PostCard({
  post,
  onVote,
  onSave,
  onShare,
  onReport,
  onPress,
}: PostCardProps) {
  const [showActions, setShowActions] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const gestureState = useRef({ isActive: false, startX: 0 });

  // Handle swipe gesture for voting
  const handleGestureEvent = useCallback((event: any) => {
    if (!gestureState.current.isActive) return;
    
    const { translationX } = event.nativeEvent;
    const clampedX = Math.max(-120, Math.min(120, translationX));
    translateX.setValue(clampedX);
  }, []);

  const handleGestureStateChange = useCallback((event: any) => {
    const { state, translationX, velocityX } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      gestureState.current.isActive = true;
      gestureState.current.startX = translationX;
    } else if (state === State.END || state === State.CANCELLED) {
      gestureState.current.isActive = false;
      
      const finalX = translationX + (velocityX * 0.1);
      
      // Check if swipe exceeded vote threshold
      if (Math.abs(finalX) > VOTE_THRESHOLD) {
        const voteType = finalX > 0 ? 'up' : 'down';
        onVote(post.id, voteType);
        
        // Show feedback animation
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: finalX > 0 ? screenWidth : -screenWidth,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Return to center
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [post.id, onVote, translateX]);

  // Format time ago
  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMinutes > 0) return `${diffMinutes}m`;
    return 'now';
  }, []);

  // Format vote count
  const formatVotes = useCallback((votes: number) => {
    if (votes >= 1000000) {
      return `${(votes / 1000000).toFixed(1)}M`;
    }
    if (votes >= 1000) {
      return `${(votes / 1000).toFixed(1)}K`;
    }
    return votes.toString();
  }, []);

  // Handle menu actions
  const handleMenuPress = useCallback(() => {
    Alert.alert(
      'Post Actions',
      `Actions for: ${post.title.substring(0, 50)}...`,
      [
        {
          text: post.saved ? 'Unsave' : 'Save',
          onPress: () => onSave(post.id, !post.saved),
        },
        {
          text: 'Share',
          onPress: () => onShare(post),
        },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => onReport(post.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [post, onSave, onShare, onReport]);

  // Render post content based on type
  const renderPostContent = () => {
    switch (post.type) {
      case 'image':
        if (post.images && post.images.length > 0) {
          return (
            <Image
              source={{ uri: post.images[0] }}
              style={styles.postImage}
              resizeMode="cover"
            />
          );
        }
        break;
        
      case 'video':
        if (post.video) {
          return (
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: post.video }}
                style={styles.postImage}
                resizeMode="cover"
              />
              <View style={styles.videoOverlay}>
                <Ionicons name="play-circle" size={48} color="rgba(255, 255, 255, 0.9)" />
              </View>
            </View>
          );
        }
        break;
        
      case 'link':
        if (post.url) {
          const domain = new URL(post.url).hostname;
          return (
            <View style={styles.linkPreview}>
              <Ionicons name="link" size={16} color="#666" />
              <Text style={styles.linkDomain}>{domain}</Text>
            </View>
          );
        }
        break;
    }
    
    if (post.content && post.type === 'text') {
      return (
        <Text style={styles.postContent} numberOfLines={4}>
          {post.content}
        </Text>
      );
    }
    
    return null;
  };

  // Render swipe indicators
  const renderSwipeIndicators = () => (
    <>
      {/* Upvote indicator (right swipe) */}
      <Animated.View
        style={[
          styles.swipeIndicator,
          styles.upvoteIndicator,
          {
            opacity: translateX.interpolate({
              inputRange: [0, VOTE_THRESHOLD],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: translateX.interpolate({
                  inputRange: [0, VOTE_THRESHOLD],
                  outputRange: [0.5, 1.2],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="arrow-up" size={32} color="#FF4500" />
        <Text style={styles.swipeText}>Upvote</Text>
      </Animated.View>

      {/* Downvote indicator (left swipe) */}
      <Animated.View
        style={[
          styles.swipeIndicator,
          styles.downvoteIndicator,
          {
            opacity: translateX.interpolate({
              inputRange: [-VOTE_THRESHOLD, 0],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: translateX.interpolate({
                  inputRange: [-VOTE_THRESHOLD, 0],
                  outputRange: [1.2, 0.5],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="arrow-down" size={32} color="#7193FF" />
        <Text style={styles.swipeText}>Downvote</Text>
      </Animated.View>
    </>
  );

  return (
    <View style={styles.container}>
      {renderSwipeIndicators()}
      
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={onPress}
            activeOpacity={0.7}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.communityInfo}>
                {post.community.avatar && (
                  <Image
                    source={{ uri: post.community.avatar }}
                    style={styles.communityAvatar}
                  />
                )}
                <Text style={styles.communityName}>r/{post.community.name}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
              </View>
              
              <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Flair and badges */}
            <View style={styles.badgeContainer}>
              {post.flair && (
                <View style={styles.flair}>
                  <Text style={styles.flairText}>{post.flair}</Text>
                </View>
              )}
              {post.isPinned && (
                <View style={[styles.badge, styles.pinnedBadge]}>
                  <Ionicons name="pin" size={12} color="#00C851" />
                  <Text style={styles.pinnedText}>Pinned</Text>
                </View>
              )}
              {post.isLocked && (
                <View style={[styles.badge, styles.lockedBadge]}>
                  <Ionicons name="lock-closed" size={12} color="#666" />
                  <Text style={styles.lockedText}>Locked</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={3}>
              {post.title}
            </Text>

            {/* Content */}
            {renderPostContent()}

            {/* Footer */}
            <View style={styles.footer}>
              {/* Vote section */}
              <View style={styles.voteSection}>
                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    post.userVote === 'up' && styles.upvoted,
                  ]}
                  onPress={() => onVote(post.id, 'up')}
                >
                  <Ionicons
                    name="arrow-up"
                    size={16}
                    color={post.userVote === 'up' ? '#FF4500' : '#666'}
                  />
                </TouchableOpacity>
                
                <Text
                  style={[
                    styles.voteCount,
                    post.userVote === 'up' && styles.upvotedText,
                    post.userVote === 'down' && styles.downvotedText,
                  ]}
                >
                  {formatVotes(post.votes)}
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    post.userVote === 'down' && styles.downvoted,
                  ]}
                  onPress={() => onVote(post.id, 'down')}
                >
                  <Ionicons
                    name="arrow-down"
                    size={16}
                    color={post.userVote === 'down' ? '#7193FF' : '#666'}
                  />
                </TouchableOpacity>
              </View>

              {/* Comment count */}
              <View style={styles.commentSection}>
                <Ionicons name="chatbubble-outline" size={16} color="#666" />
                <Text style={styles.commentCount}>{post.commentCount}</Text>
              </View>

              {/* Awards */}
              {post.awards && post.awards.length > 0 && (
                <View style={styles.awardsSection}>
                  <Ionicons name="trophy" size={16} color="#FFD700" />
                  <Text style={styles.awardsCount}>{post.awards.length}</Text>
                </View>
              )}

              {/* Save button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => onSave(post.id, !post.saved)}
              >
                <Ionicons
                  name={post.saved ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={post.saved ? '#FFD700' : '#666'}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: -40,
  },
  upvoteIndicator: {
    left: 20,
    backgroundColor: 'rgba(255, 69, 0, 0.1)',
  },
  downvoteIndicator: {
    right: 20,
    backgroundColor: 'rgba(113, 147, 255, 0.1)',
  },
  swipeText: {
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: spacing.xs,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginVertical: 6,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  communityAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  communityName: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#333',
  },
  separator: {
    fontSize: typography.body2,
    color: '#999',
    marginHorizontal: 6,
  },
  timeAgo: {
    fontSize: typography.body2,
    color: '#666',
  },
  menuButton: {
    padding: spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  flair: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginRight: spacing.sm,
  },
  flairText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: spacing.sm,
  },
  pinnedBadge: {
    backgroundColor: 'rgba(0, 200, 81, 0.1)',
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00C851',
    marginLeft: 2,
  },
  lockedBadge: {
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
  },
  lockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginLeft: 2,
  },
  title: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  postContent: {
    fontSize: typography.body2,
    color: '#666',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: spacing.md,
    backgroundColor: '#f0f0f0',
  },
  videoContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  linkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  linkDomain: {
    fontSize: typography.body2,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: spacing.xs,
  },
  voteButton: {
    padding: spacing.sm,
    borderRadius: 16,
  },
  upvoted: {
    backgroundColor: 'rgba(255, 69, 0, 0.1)',
  },
  downvoted: {
    backgroundColor: 'rgba(113, 147, 255, 0.1)',
  },
  voteCount: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  upvotedText: {
    color: '#FF4500',
  },
  downvotedText: {
    color: '#7193FF',
  },
  commentSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    fontSize: typography.body2,
    color: '#666',
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  awardsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  awardsCount: {
    fontSize: typography.body2,
    color: '#FFD700',
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  saveButton: {
    padding: spacing.sm,
  },
});