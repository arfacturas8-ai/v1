import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { useSocketStore } from '../../stores/socketStore';
import apiService from '../../services/RealApiService';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type ChatRoomRouteProp = RouteProp<MainStackParamList, 'ChatRoom'>;
type ChatRoomNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ChatRoom'>;

interface Message {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  isOwn?: boolean;
  reactions?: { emoji: string; count: number; users: string[] }[];
  channelId: string;
  serverId?: string;
  attachments?: any[];
  mentions?: string[];
  isEdited: boolean;
  editedAt?: string;
  replyTo?: string;
}

// Remove mock messages - will load from API

export function ChatRoomScreen() {
  const route = useRoute<ChatRoomRouteProp>();
  const navigation = useNavigation<ChatRoomNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const { roomId, roomName } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { socket, isConnected, sendMessage } = useSocketStore();

  const flatListRef = useRef<FlatList>(null);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [roomId]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join the channel
    socket.emit('join-channel', { channelId: roomId });

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, { ...message, isOwn: message.authorId === user?.id }];
      });
    };

    // Listen for typing indicators
    const handleTyping = (data: { userId: string; username: string; isTyping: boolean }) => {
      if (data.userId === user?.id) return; // Don't show own typing
      
      setTypingUsers(prev => {
        if (data.isTyping && !prev.includes(data.username)) {
          return [...prev, data.username];
        } else if (!data.isTyping) {
          return prev.filter(name => name !== data.username);
        }
        return prev;
      });
    };

    // Listen for message updates
    const handleMessageUpdate = (updatedMessage: Message) => {
      setMessages(prev => prev.map(msg => 
        msg.id === updatedMessage.id 
          ? { ...updatedMessage, isOwn: updatedMessage.authorId === user?.id }
          : msg
      ));
    };

    // Listen for message deletions
    const handleMessageDelete = (messageId: string) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);
    socket.on('message-updated', handleMessageUpdate);
    socket.on('message-deleted', handleMessageDelete);

    return () => {
      socket.emit('leave-channel', { channelId: roomId });
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
      socket.off('message-updated', handleMessageUpdate);
      socket.off('message-deleted', handleMessageDelete);
    };
  }, [socket, isConnected, roomId, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMessages(roomId);
      
      if (response && Array.isArray(response)) {
        const messagesWithOwnership = response.map(msg => ({
          id: msg.id,
          content: msg.content,
          authorId: msg.sender.id,
          authorName: msg.sender.username,
          authorAvatar: msg.sender.avatar,
          timestamp: msg.createdAt,
          type: msg.type,
          isOwn: msg.sender.id === user?.id,
          reactions: msg.reactions || [],
          channelId: msg.channel || roomId,
          attachments: [],
          mentions: [],
          isEdited: msg.isEdited || false,
          editedAt: msg.updatedAt,
        }));
        setMessages(messagesWithOwnership);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const messageContent = inputText.trim();
    setInputText(''); // Clear input immediately for better UX

    try {
      // Send via API
      const response = await apiService.sendMessage(messageContent, undefined, roomId);
      
      if (!response.success && !response.message) {
        throw new Error('Failed to send message');
      }

      // Also send via socket for real-time updates
      if (socket && isConnected) {
        socket.emit('send-message', {
          channelId: roomId,
          content: messageContent,
          type: 'text'
        });
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageContent); // Restore input on error
    }
  }, [inputText, roomId, socket, isConnected]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReactions = msg.reactions || [];
        const existingReaction = existingReactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          // Toggle reaction
          return {
            ...msg,
            reactions: existingReactions.map(r =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            ),
          };
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [...existingReactions, { emoji, count: 1 }],
          };
        }
      }
      return msg;
    }));
  }, []);

  const handleLongPress = useCallback((message: Message) => {
    const actions = [
      { text: 'React with 👍', onPress: () => handleReaction(message.id, '👍') },
      { text: 'React with ❤️', onPress: () => handleReaction(message.id, '❤️') },
      { text: 'React with 😂', onPress: () => handleReaction(message.id, '😂') },
    ];

    if (message.isOwn) {
      actions.push({
        text: 'Delete',
        onPress: () => {
          Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  setMessages(prev => prev.filter(m => m.id !== message.id));
                },
              },
            ]
          );
        },
      });
    }

    actions.push({ text: 'Cancel', onPress: () => {} });

    Alert.alert('Message Actions', '', actions);
  }, [handleReaction]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle typing indicators
  const handleInputChange = (text: string) => {
    setInputText(text);
    
    if (!socket || !isConnected) return;

    // Send typing start event
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      socket.emit('typing-start', { channelId: roomId });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing-stop', { channelId: roomId });
      }
    }, 2000);

    // Stop typing if input is empty
    if (text.length === 0 && isTyping) {
      setIsTyping(false);
      socket.emit('typing-stop', { channelId: roomId });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAuthor = !prevMessage || prevMessage.authorId !== item.authorId;

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          item.isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
      >
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: item.isOwn ? colors.primary : colors.card,
            marginLeft: item.isOwn ? 60 : 0,
            marginRight: item.isOwn ? 0 : 60,
          }
        ]}>
          {!item.isOwn && showAuthor && (
            <View style={styles.messageHeader}>
              {item.authorAvatar && (
                <Image source={{ uri: item.authorAvatar }} style={styles.authorAvatar} />
              )}
              <Text style={[styles.authorName, { color: colors.primary }]}>
                {item.authorName}
              </Text>
            </View>
          )}

          <Text style={[
            styles.messageText,
            { color: item.isOwn ? '#ffffff' : colors.text }
          ]}>
            {item.content}
          </Text>

          <Text style={[
            styles.messageTime,
            { color: item.isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {formatTime(item.timestamp)}
          </Text>

          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {item.reactions.map((reaction, idx) => (
                <TouchableOpacity
                  key={`${reaction.emoji}-${idx}`}
                  style={[styles.reactionBubble, { backgroundColor: colors.surface }]}
                  onPress={() => handleReaction(item.id, reaction.emoji)}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={[styles.reactionCount, { color: colors.text }]}>
                    {reaction.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={[styles.typingText, { color: colors.textSecondary }]}>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </Text>
      </View>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />

      {renderTypingIndicator()}

      <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => Alert.alert('Coming Soon', 'File attachments will be available soon!')}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>

        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={handleInputChange}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? colors.primary : colors.border }
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: spacing.lg,
  },
  messageContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 16,
    position: 'relative',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
  },
  authorName: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  messageText: {
    fontSize: typography.body1,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 6,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: typography.caption,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  typingContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  typingText: {
    fontSize: typography.caption,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  attachButton: {
    padding: spacing.xs,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: typography.body1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.body1,
    opacity: 0.7,
  },
});