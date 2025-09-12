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
import { MainStackParamList } from '../../navigation/MainNavigator';

type ChatRoomRouteProp = RouteProp<MainStackParamList, 'ChatRoom'>;
type ChatRoomNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ChatRoom'>;

interface Message {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system';
  isOwn: boolean;
  reactions?: { emoji: string; count: number }[];
}

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hey everyone! Welcome to our chat room.',
    authorId: '1',
    authorName: 'Alice Johnson',
    authorAvatar: 'https://via.placeholder.com/40',
    timestamp: new Date(Date.now() - 3600000),
    type: 'text',
    isOwn: false,
  },
  {
    id: '2',
    content: 'Thanks for setting this up! Excited to be here.',
    authorId: '2',
    authorName: 'You',
    timestamp: new Date(Date.now() - 3000000),
    type: 'text',
    isOwn: true,
  },
  {
    id: '3',
    content: 'Does anyone have experience with React Native animations?',
    authorId: '3',
    authorName: 'Bob Smith',
    authorAvatar: 'https://via.placeholder.com/40',
    timestamp: new Date(Date.now() - 1800000),
    type: 'text',
    isOwn: false,
    reactions: [
      { emoji: '👍', count: 2 },
      { emoji: '🤔', count: 1 },
    ],
  },
  {
    id: '4',
    content: 'I have some experience with Reanimated 3. Happy to help!',
    authorId: '2',
    authorName: 'You',
    timestamp: new Date(Date.now() - 1500000),
    type: 'text',
    isOwn: true,
  },
];

export function ChatRoomScreen() {
  const route = useRoute<ChatRoomRouteProp>();
  const navigation = useNavigation<ChatRoomNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const { roomId, roomName } = route.params;

  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // TODO: Connect to WebSocket and load messages
    // Scroll to bottom on mount
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      authorId: user?.id || '2',
      authorName: user?.username || 'You',
      timestamp: new Date(),
      type: 'text',
      isOwn: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // TODO: Send message via WebSocket/API

    // Auto scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, user]);

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

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          onChangeText={setInputText}
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
    paddingVertical: 16,
  },
  messageContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    position: 'relative',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  attachButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
});