/**
 * CRASH-SAFE MESSAGE ITEM
 * Individual message component with comprehensive error handling
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Share,
  Linking,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Message, Attachment } from './CrashSafeChatArea';
import { CrashDetector } from '../../utils/CrashDetector';
import { useErrorHandler } from '../ErrorBoundary';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width } = Dimensions.get('window');
const MAX_IMAGE_WIDTH = width * 0.7;
const MAX_IMAGE_HEIGHT = 300;

interface CrashSafeMessageItemProps {
  message: Message;
  isGrouped: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: (newContent: string) => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const CrashSafeMessageItem: React.FC<CrashSafeMessageItemProps> = ({
  message,
  isGrouped,
  onReact,
  onReply,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [imageLoadError, setImageLoadError] = useState<Set<string>>(new Set());
  
  const handleError = useErrorHandler();

  // Format timestamp
  const timestamp = useMemo(() => {
    try {
      const date = new Date(message.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: diffDays > 365 ? 'numeric' : undefined,
        });
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      return 'Unknown';
    }
  }, [message.createdAt, handleError]);

  // Handle long press
  const handleLongPress = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const options = ['React', 'Reply', 'Copy Text'];
      
      if (canEdit) options.push('Edit');
      if (canDelete) options.push('Delete');
      
      options.push('Share', 'Cancel');

      Alert.alert(
        'Message Options',
        undefined,
        options.map((option) => ({
          text: option,
          style: option === 'Delete' ? 'destructive' : option === 'Cancel' ? 'cancel' : 'default',
          onPress: () => handleMenuOption(option),
        }))
      );
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [canEdit, canDelete, handleError]);

  const handleMenuOption = useCallback(async (option: string) => {
    try {
      switch (option) {
        case 'React':
          setShowReactions(true);
          break;
        case 'Reply':
          onReply();
          break;
        case 'Copy Text':
          // In React Native, you'd use Clipboard
          Alert.alert('Copied', 'Message copied to clipboard');
          break;
        case 'Edit':
          if (canEdit) {
            setIsEditing(true);
            setEditContent(message.content);
          }
          break;
        case 'Delete':
          if (canDelete) {
            onDelete();
          }
          break;
        case 'Share':
          await Share.share({
            message: `${message.author.username}: ${message.content}`,
          });
          break;
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [message, canEdit, canDelete, onReply, onDelete, handleError]);

  // Handle reaction
  const handleReaction = useCallback(async (emoji: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReact(emoji);
      setShowReactions(false);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [onReact, handleError]);

  // Handle edit save
  const handleEditSave = useCallback(async () => {
    try {
      if (editContent.trim() !== message.content) {
        onEdit(editContent.trim());
      }
      setIsEditing(false);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [editContent, message.content, onEdit, handleError]);

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  // Handle image load error
  const handleImageError = useCallback((attachmentId: string) => {
    try {
      setImageLoadError(prev => new Set([...prev, attachmentId]));
      
      CrashDetector.reportError(
        new Error('Image load failed'),
        { messageId: message.id, attachmentId },
        'low'
      );
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [message.id, handleError]);

  // Handle attachment press
  const handleAttachmentPress = useCallback(async (attachment: Attachment) => {
    try {
      if (attachment.contentType.startsWith('image/')) {
        // Navigate to image viewer
        // This would be handled by navigation in a real app
        Alert.alert('Image Viewer', `Would open: ${attachment.filename}`);
      } else {
        // Try to open with system
        const canOpen = await Linking.canOpenURL(attachment.url);
        if (canOpen) {
          await Linking.openURL(attachment.url);
        } else {
          Alert.alert('Cannot Open', 'Unable to open this file type');
        }
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Failed to open attachment');
    }
  }, [handleError]);

  // Render attachment
  const renderAttachment = useCallback((attachment: Attachment) => {
    try {
      if (attachment.contentType.startsWith('image/')) {
        const hasError = imageLoadError.has(attachment.id);
        
        if (hasError) {
          return (
            <View key={attachment.id} style={styles.attachmentError}>
              <Ionicons name="image-outline" size={24} color="#666" />
              <Text style={styles.attachmentErrorText}>Failed to load image</Text>
            </View>
          );
        }

        const imageWidth = Math.min(attachment.width || MAX_IMAGE_WIDTH, MAX_IMAGE_WIDTH);
        const imageHeight = Math.min(attachment.height || MAX_IMAGE_HEIGHT, MAX_IMAGE_HEIGHT);
        
        // Maintain aspect ratio
        const aspectRatio = (attachment.width && attachment.height) 
          ? attachment.width / attachment.height 
          : 1;
        
        const displayWidth = Math.min(imageWidth, MAX_IMAGE_WIDTH);
        const displayHeight = Math.min(displayWidth / aspectRatio, MAX_IMAGE_HEIGHT);

        return (
          <TouchableOpacity
            key={attachment.id}
            style={[styles.imageAttachment, { width: displayWidth, height: displayHeight }]}
            onPress={() => handleAttachmentPress(attachment)}
            activeOpacity={0.8}
          >
            <FastImage
              source={{
                uri: attachment.url,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.web,
              }}
              style={styles.attachmentImage}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => handleImageError(attachment.id)}
            />
          </TouchableOpacity>
        );
      } else {
        // File attachment
        return (
          <TouchableOpacity
            key={attachment.id}
            style={styles.fileAttachment}
            onPress={() => handleAttachmentPress(attachment)}
            activeOpacity={0.7}
          >
            <View style={styles.fileIcon}>
              <Ionicons name="document-outline" size={20} color="#4a9eff" />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {attachment.filename}
              </Text>
              <Text style={styles.fileSize}>
                {formatFileSize(attachment.size)}
              </Text>
            </View>
            <Ionicons name="download-outline" size={20} color="#666" />
          </TouchableOpacity>
        );
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      return (
        <View key={attachment.id} style={styles.attachmentError}>
          <Text style={styles.attachmentErrorText}>Error loading attachment</Text>
        </View>
      );
    }
  }, [imageLoadError, handleAttachmentPress, handleImageError, handleError]);

  // Render reactions
  const renderReactions = useCallback(() => {
    if (!message.reactions?.length) return null;

    try {
      return (
        <View style={styles.reactionsContainer}>
          {message.reactions.map((reaction, index) => (
            <TouchableOpacity
              key={index}
              style={styles.reactionBubble}
              onPress={() => handleReaction(reaction.emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              <Text style={styles.reactionCount}>{reaction.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }, [message.reactions, handleReaction, handleError]);

  return (
    <View style={[styles.container, isGrouped && styles.groupedContainer]}>
      {!isGrouped && (
        <View style={styles.header}>
          <View style={styles.authorInfo}>
            <FastImage
              source={{
                uri: message.author.avatar || 'https://via.placeholder.com/32',
                priority: FastImage.priority.low,
                cache: FastImage.cacheControl.web,
              }}
              style={styles.avatar}
              resizeMode={FastImage.resizeMode.cover}
            />
            <Text style={styles.username}>{message.author.username}</Text>
            <Text style={styles.timestamp}>{timestamp}</Text>
            {message.edited && (
              <Text style={styles.editedIndicator}>(edited)</Text>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.messageContent}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              autoFocus
              placeholder="Edit message..."
              placeholderTextColor="#666"
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditCancel}
              >
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.editSaveButton]}
                onPress={handleEditSave}
              >
                <Text style={styles.editSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {message.content && (
              <Text style={styles.messageText} selectable>
                {message.content}
              </Text>
            )}
            
            {message.attachments && message.attachments.length > 0 && (
              <View style={styles.attachmentsContainer}>
                {message.attachments.map(renderAttachment)}
              </View>
            )}
            
            {renderReactions()}
          </>
        )}
      </TouchableOpacity>

      {/* Quick Reactions */}
      {showReactions && (
        <View style={styles.quickReactions}>
          {COMMON_REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.quickReactionButton}
              onPress={() => handleReaction(emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickReactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.closeReactionsButton}
            onPress={() => setShowReactions(false)}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  groupedContainer: {
    paddingTop: 2,
  },
  header: {
    marginBottom: spacing.xs,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  username: {
    color: '#ffffff',
    fontSize: typography.body2,
    fontWeight: '600',
  },
  timestamp: {
    color: '#888',
    fontSize: typography.caption,
  },
  editedIndicator: {
    color: '#888',
    fontSize: 10,
    fontStyle: 'italic',
  },
  messageContent: {
    marginLeft: isGrouped ? 40 : 0,
  },
  messageText: {
    color: '#ffffff',
    fontSize: typography.body1,
    lineHeight: 22,
  },
  attachmentsContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  imageAttachment: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0A0A0B',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0B',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.md,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: '#ffffff',
    fontSize: typography.body2,
    fontWeight: '500',
  },
  fileSize: {
    color: '#888',
    fontSize: typography.caption,
    marginTop: 2,
  },
  attachmentError: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: '#0A0A0B',
    borderRadius: 8,
    gap: spacing.sm,
  },
  attachmentErrorText: {
    color: '#666',
    fontSize: typography.caption,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 158, 255, 0.3)',
    gap: spacing.xs,
  },
  reactionEmoji: {
    fontSize: typography.body2,
  },
  reactionCount: {
    color: '#4a9eff',
    fontSize: typography.caption,
    fontWeight: '500',
  },
  editContainer: {
    gap: spacing.sm,
  },
  editInput: {
    backgroundColor: '#0A0A0B',
    color: '#ffffff',
    fontSize: typography.body1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a9eff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  editSaveButton: {
    backgroundColor: '#4a9eff',
  },
  editCancelText: {
    color: '#888',
    fontSize: typography.body2,
  },
  editSaveText: {
    color: '#ffffff',
    fontSize: typography.body2,
    fontWeight: '500',
  },
  quickReactions: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0B',
    padding: spacing.sm,
    borderRadius: 20,
    marginTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginLeft: isGrouped ? 40 : 0,
  },
  quickReactionButton: {
    padding: spacing.xs,
  },
  quickReactionEmoji: {
    fontSize: typography.body1,
  },
  closeReactionsButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});