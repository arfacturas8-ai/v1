import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import apiService from '../../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  post: {
    id: string;
    title: string;
  };
  votes: number;
  userVote?: 'up' | 'down' | null;
  replies: Comment[];
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  audio?: string;
  isCollapsed?: boolean;
  depth?: number;
}

interface CommentThreadProps {
  comment: Comment;
  depth?: number;
  maxDepth?: number;
  onVote: (commentId: string, voteType: 'up' | 'down') => void;
  onReply: (commentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
}

const MAX_DISPLAY_DEPTH = 6;
const INDENT_WIDTH = 16;

export default function CommentThread({
  comment,
  depth = 0,
  maxDepth = MAX_DISPLAY_DEPTH,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onReport,
}: CommentThreadProps) {
  const [collapsed, setCollapsed] = useState(comment.isCollapsed || false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);
  
  const animatedHeight = useRef(new Animated.Value(1)).current;
  const indentWidth = Math.min(depth * INDENT_WIDTH, maxDepth * INDENT_WIDTH);

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

  // Toggle collapse
  const toggleCollapse = useCallback(() => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    
    Animated.timing(animatedHeight, {
      toValue: newCollapsed ? 0.3 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [collapsed, animatedHeight]);

  // Handle reply submit
  const handleReplySubmit = useCallback(async () => {
    if (!replyText.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [comment.id, replyText, onReply, submitting]);

  // Handle edit submit
  const handleEditSubmit = useCallback(async () => {
    if (!editText.trim() || submitting || !onEdit) return;
    
    setSubmitting(true);
    try {
      await onEdit(comment.id, editText.trim());
      setShowEditForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to edit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [comment.id, editText, onEdit, submitting]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!onDelete) return;
    
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(comment.id),
        },
      ]
    );
  }, [comment.id, onDelete]);

  // Handle report
  const handleReport = useCallback(() => {
    if (!onReport) return;
    
    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Spam', onPress: () => onReport(comment.id) },
        { text: 'Harassment', onPress: () => onReport(comment.id) },
        { text: 'Misinformation', onPress: () => onReport(comment.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [comment.id, onReport]);

  // Render reply form
  const renderReplyForm = () => {
    if (!showReplyForm) return null;
    
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.replyForm}>
          <TextInput
            style={styles.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write a reply..."
            multiline
            maxLength={1000}
            autoFocus
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowReplyForm(false);
                setReplyText('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!replyText.trim() || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleReplySubmit}
              disabled={!replyText.trim() || submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Posting...' : 'Reply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // Render edit form
  const renderEditForm = () => {
    if (!showEditForm) return null;
    
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.editForm}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            maxLength={1000}
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowEditForm(false);
                setEditText(comment.content);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!editText.trim() || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleEditSubmit}
              disabled={!editText.trim() || submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          marginLeft: indentWidth,
          opacity: animatedHeight,
        },
      ]}
    >
      {/* Thread line */}
      {depth > 0 && (
        <View 
          style={[
            styles.threadLine,
            { left: -8 - (indentWidth > 0 ? 8 : 0) },
          ]} 
        />
      )}
      
      {/* Comment header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Text style={styles.username}>u/{comment.author.username}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(comment.createdAt)}</Text>
        </View>
        
        {comment.replies.length > 0 && (
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={toggleCollapse}
          >
            <Ionicons
              name={collapsed ? 'chevron-forward' : 'chevron-down'}
              size={16}
              color="#666"
            />
            <Text style={styles.replyCount}>
              {comment.replies.length}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comment content */}
      {!collapsed && (
        <View style={styles.content}>
          {showEditForm ? (
            renderEditForm()
          ) : (
            <Text style={styles.commentText} selectable>
              {comment.content}
            </Text>
          )}

          {/* Vote and action buttons */}
          <View style={styles.actions}>
            {/* Vote section */}
            <View style={styles.voteSection}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  comment.userVote === 'up' && styles.upvoted,
                ]}
                onPress={() => onVote(comment.id, 'up')}
              >
                <Ionicons
                  name="arrow-up"
                  size={14}
                  color={comment.userVote === 'up' ? '#FF4500' : '#666'}
                />
              </TouchableOpacity>
              
              <Text
                style={[
                  styles.voteCount,
                  comment.userVote === 'up' && styles.upvotedText,
                  comment.userVote === 'down' && styles.downvotedText,
                ]}
              >
                {formatVotes(comment.votes)}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  comment.userVote === 'down' && styles.downvoted,
                ]}
                onPress={() => onVote(comment.id, 'down')}
              >
                <Ionicons
                  name="arrow-down"
                  size={14}
                  color={comment.userVote === 'down' ? '#7193FF' : '#666'}
                />
              </TouchableOpacity>
            </View>

            {/* Action buttons */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowReplyForm(true)}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#666" />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>

            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowEditForm(true)}
              >
                <Ionicons name="create-outline" size={14} color="#666" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReport}
            >
              <Ionicons name="flag-outline" size={14} color="#666" />
              <Text style={styles.actionText}>Report</Text>
            </TouchableOpacity>

            {onDelete && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reply form */}
          {renderReplyForm()}
        </View>
      )}

      {/* Nested replies */}
      {!collapsed && comment.replies.length > 0 && (
        <View style={styles.replies}>
          {depth >= maxDepth ? (
            <TouchableOpacity style={styles.continueThread}>
              <Text style={styles.continueThreadText}>
                Continue this thread →
              </Text>
            </TouchableOpacity>
          ) : (
            comment.replies.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                maxDepth={maxDepth}
                onVote={onVote}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReport={onReport}
              />
            ))
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
    position: 'relative',
  },
  threadLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  username: {
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
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    backgroundColor: '#f0f0f0',
  },
  replyCount: {
    fontSize: typography.caption,
    color: '#666',
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  content: {
    paddingLeft: spacing.sm,
  },
  commentText: {
    fontSize: typography.body2,
    color: '#333',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  voteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 2,
    marginRight: spacing.md,
  },
  voteButton: {
    padding: 6,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
  },
  upvoted: {
    backgroundColor: 'rgba(255, 69, 0, 0.1)',
  },
  downvoted: {
    backgroundColor: 'rgba(113, 147, 255, 0.1)',
  },
  voteCount: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: '#333',
    minWidth: 24,
    textAlign: 'center',
  },
  upvotedText: {
    color: '#FF4500',
  },
  downvotedText: {
    color: '#7193FF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  actionText: {
    fontSize: typography.caption,
    color: '#666',
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  deleteText: {
    color: '#FF3B30',
  },
  replies: {
    marginTop: spacing.sm,
  },
  continueThread: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  continueThreadText: {
    fontSize: typography.body2,
    color: '#007AFF',
    fontWeight: '500',
  },
  replyForm: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  replyInput: {
    fontSize: typography.body2,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    padding: 0,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  editForm: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#fff5e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffd480',
  },
  editInput: {
    fontSize: typography.body2,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    padding: 0,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    fontSize: typography.body2,
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: typography.body2,
    color: '#fff',
    fontWeight: '600',
  },
});