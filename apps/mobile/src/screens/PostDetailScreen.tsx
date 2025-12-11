import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, scale, deviceInfo } from '../utils/responsive';
import * as Haptics from 'expo-haptics';
import { nativeIntegrationService } from '../services/NativeIntegrationService';

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
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
  type: 'text' | 'image' | 'video' | 'link' | 'poll';
  url?: string;
  flair?: string;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  votes: number;
  userVote?: 'up' | 'down' | null;
  replies?: Comment[];
  createdAt: string;
  depth: number;
}

interface PostDetailScreenProps {
  route: {
    params: {
      postId: string;
    };
  };
  navigation: any;
}

export function PostDetailScreen({ route, navigation }: PostDetailScreenProps) {
  const { postId } = route.params;
  const { colors } = useTheme();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    loadPostDetails();
  }, [postId]);

  const loadPostDetails = async () => {
    try {
      setLoading(true);
      // TODO: Load post and comments from API
      // const response = await apiService.getPost(postId);
      // setPost(response.post);
      // setComments(response.comments);

      // Mock data for now
      setPost({
        id: postId,
        title: 'Sample Post Title',
        content: 'This is the post content...',
        author: {
          id: '1',
          username: 'user123',
          displayName: 'User 123',
        },
        community: {
          id: 'c1',
          name: 'general',
        },
        votes: 42,
        commentCount: 5,
        createdAt: new Date().toISOString(),
        type: 'text',
      });
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPostDetails();
    setRefreshing(false);
  }, []);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!post) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // TODO: Implement voting API call
    const newVote = post.userVote === voteType ? null : voteType;
    setPost({
      ...post,
      userVote: newVote,
      votes: post.votes + (newVote === 'up' ? 1 : newVote === 'down' ? -1 : 0),
    });
  };

  const handleCommentVote = async (commentId: string, voteType: 'up' | 'down') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement comment voting
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;

    try {
      setSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // TODO: Submit comment to API
      // await apiService.createComment(postId, commentText, replyingTo);

      setCommentText('');
      setReplyingTo(null);
      await loadPostDetails();
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;

    const success = await nativeIntegrationService.shareContent({
      title: post.title,
      message: post.content,
      url: `https://cryb.app/post/${post.id}`,
    });

    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderComment = (comment: Comment) => (
    <View
      key={comment.id}
      style={[
        styles.comment,
        {
          marginLeft: comment.depth * spacing.lg,
          borderLeftColor: colors.border,
          backgroundColor: colors.card,
        }
      ]}
    >
      <View style={styles.commentHeader}>
        <Text style={[styles.commentAuthor, { color: colors.text }]}>
          {comment.author.displayName}
        </Text>
        <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
          {new Date(comment.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={[styles.commentContent, { color: colors.text }]}>
        {comment.content}
      </Text>

      <View style={styles.commentActions}>
        <TouchableOpacity
          onPress={() => handleCommentVote(comment.id, 'up')}
          style={styles.commentAction}
        >
          <Feather
            name="arrow-up"
            size={16}
            color={comment.userVote === 'up' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.voteCount, { color: colors.textSecondary }]}>
            {comment.votes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleCommentVote(comment.id, 'down')}
          style={styles.commentAction}
        >
          <Feather
            name="arrow-down"
            size={16}
            color={comment.userVote === 'down' ? '#FF4458' : colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setReplyingTo(comment.id)}
          style={styles.commentAction}
        >
          <Feather name="message-circle" size={16} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            Reply
          </Text>
        </TouchableOpacity>
      </View>

      {comment.replies?.map(renderComment)}
    </View>
  );

  if (loading && !post) {
    return null;
  }

  if (!post) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Post not found
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Post Header */}
          <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
            <View style={styles.postHeader}>
              <Text style={[styles.communityName, { color: colors.primary }]}>
                r/{post.community.name}
              </Text>
              <Text style={[styles.author, { color: colors.textSecondary }]}>
                Posted by u/{post.author.username}
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {post.title}
            </Text>

            {/* Content */}
            <Text style={[styles.content, { color: colors.text }]}>
              {post.content}
            </Text>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={() => handleVote('up')}
                style={styles.voteButton}
              >
                <Feather
                  name="arrow-up"
                  size={22}
                  color={post.userVote === 'up' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.voteText, { color: colors.text }]}>
                  {post.votes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleVote('down')}
                style={styles.voteButton}
              >
                <Feather
                  name="arrow-down"
                  size={22}
                  color={post.userVote === 'down' ? '#FF4458' : colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Feather name="message-circle" size={20} color={colors.textSecondary} />
                <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                  {post.commentCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                <Feather name="share" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={[styles.commentsHeader, { color: colors.text }]}>
              Comments ({comments.length})
            </Text>

            {comments.map(renderComment)}

            {comments.length === 0 && (
              <View style={styles.noComments}>
                <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={[styles.replyingToText, { color: colors.textSecondary }]}>
                Replying to comment
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Feather name="x" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={10000}
            />

            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
              style={[
                styles.sendButton,
                { backgroundColor: commentText.trim() ? colors.primary : colors.border }
              ]}
            >
              <Feather name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.body1,
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  postHeader: {
    marginBottom: spacing.md,
  },
  communityName: {
    fontSize: typography.body2,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  author: {
    fontSize: typography.caption,
  },
  title: {
    fontSize: typography.h6,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  content: {
    fontSize: typography.body1,
    lineHeight: typography.body1 * 1.5,
    marginBottom: spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  voteText: {
    marginLeft: spacing.xs,
    fontSize: typography.body2,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionButtonText: {
    marginLeft: spacing.xs,
    fontSize: typography.body2,
  },
  commentsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  commentsHeader: {
    fontSize: typography.h6,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  comment: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 2,
    borderRadius: scale(8),
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentAuthor: {
    fontSize: typography.body2,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  commentTime: {
    fontSize: typography.caption,
  },
  commentContent: {
    fontSize: typography.body2,
    lineHeight: typography.body2 * 1.4,
    marginBottom: spacing.sm,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  voteCount: {
    marginLeft: spacing.xs,
    fontSize: typography.caption,
  },
  actionText: {
    marginLeft: spacing.xs,
    fontSize: typography.caption,
  },
  noComments: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: typography.body2,
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: spacing.md,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  replyingToText: {
    fontSize: typography.caption,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: scale(40),
    maxHeight: scale(100),
    borderRadius: scale(20),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    fontSize: typography.body2,
  },
  sendButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
