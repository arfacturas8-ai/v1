/**
 * MESSAGES SCREEN
 * Central hub for all messaging activities - DMs, server messages, and notifications
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useNetworkContext } from '../contexts/NetworkContext';
import { MainStackParamList } from '../navigation/MainNavigator';
import { 
  Avatar, 
  Button, 
  Card, 
  LoadingSpinner, 
  SearchInput,
  SkeletonLoader,
} from '../components/ui';
import apiService from '../services/RealApiService';
import { useAuthStore } from '../stores/authStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

type MessagesScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name: string;
  description?: string;
  participants: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    isOnline: boolean;
  }[];
  lastMessage?: {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    timestamp: string;
    type: 'text' | 'image' | 'file' | 'system';
  };
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  serverId?: string;
  serverName?: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
  onLongPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = React.memo(({ 
  conversation, 
  onPress, 
  onLongPress 
}) => {
  const { colors, spacing } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [scaleAnim]);

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const getDisplayName = useCallback(() => {
    if (conversation.type === 'direct') {
      const otherUser = conversation.participants.find(p => p.id !== conversation.id);
      return otherUser?.displayName || conversation.name;
    }
    return conversation.name;
  }, [conversation]);

  const getDisplayAvatar = useCallback(() => {
    if (conversation.type === 'direct') {
      const otherUser = conversation.participants.find(p => p.id !== conversation.id);
      return otherUser?.avatar || conversation.avatar;
    }
    return conversation.avatar;
  }, [conversation]);

  const getOnlineStatus = useCallback(() => {
    if (conversation.type === 'direct') {
      const otherUser = conversation.participants.find(p => p.id !== conversation.id);
      return otherUser?.isOnline || false;
    }
    return false;
  }, [conversation]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { backgroundColor: colors.cardBackground },
          conversation.unreadCount > 0 && { backgroundColor: colors.primary + '08' }
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        delayLongPress={500}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar
            size="lg"
            source={getDisplayAvatar()}
            name={getDisplayName()}
            showOnlineStatus={conversation.type === 'direct'}
            isOnline={getOnlineStatus()}
          />
          {conversation.isPinned && (
            <View style={[styles.pinnedBadge, { backgroundColor: colors.warning }]}>
              <Ionicons name="bookmark" size={10} color={colors.background} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text 
              style={[
                styles.conversationName, 
                { color: colors.text },
                conversation.unreadCount > 0 && { fontWeight: '600' }
              ]}
              numberOfLines={1}
            >
              {getDisplayName()}
            </Text>
            <View style={styles.conversationMeta}>
              {conversation.lastMessage && (
                <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                  {formatTimestamp(conversation.lastMessage.timestamp)}
                </Text>
              )}
              {conversation.isMuted && (
                <Ionicons 
                  name="notifications-off" 
                  size={14} 
                  color={colors.textSecondary} 
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>

          {/* Last Message */}
          {conversation.lastMessage ? (
            <View style={styles.lastMessageContainer}>
              <Text 
                style={[
                  styles.lastMessage, 
                  { color: colors.textSecondary },
                  conversation.unreadCount > 0 && { 
                    color: colors.text, 
                    fontWeight: '500' 
                  }
                ]}
                numberOfLines={1}
              >
                {conversation.lastMessage.type === 'image' 
                  ? '📷 Image' 
                  : conversation.lastMessage.type === 'file'
                  ? '📎 File'
                  : conversation.lastMessage.content
                }
              </Text>
              {conversation.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.unreadCount, { color: colors.textInverse }]}>
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.noMessages, { color: colors.textTertiary }]}>
              No messages yet
            </Text>
          )}

          {/* Server info for channel conversations */}
          {conversation.type === 'channel' && conversation.serverName && (
            <Text style={[styles.serverInfo, { color: colors.textTertiary }]}>
              #{conversation.name} • {conversation.serverName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<MessagesScreenNavigationProp>();
  const { colors, spacing } = useTheme();
  const { isConnected } = useNetworkContext();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'direct' | 'groups'>('all');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load conversations on screen focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  // Filter conversations based on search and filter
  useEffect(() => {
    let filtered = conversations;

    // Apply text filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.name.toLowerCase().includes(query) ||
        conv.participants.some(p => 
          p.displayName.toLowerCase().includes(query) ||
          p.username.toLowerCase().includes(query)
        ) ||
        conv.lastMessage?.content.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'direct':
        filtered = filtered.filter(conv => conv.type === 'direct');
        break;
      case 'groups':
        filtered = filtered.filter(conv => conv.type === 'group' || conv.type === 'channel');
        break;
    }

    // Sort: pinned first, then by last message timestamp
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    setFilteredConversations(filtered);
  }, [conversations, searchQuery, filter]);

  const loadConversations = useCallback(async () => {
    try {
      if (!isConnected) {
        setError('No internet connection');
        return;
      }

      setError(null);
      if (!isRefreshing) {
        setIsLoading(true);
      }

      // Fetch real conversations from API
      const [messagesResponse, conversationsResponse] = await Promise.all([
        apiService.getMessages(undefined, undefined, 50, 0),
        apiService.getConversations()
      ]);

      const conversations: Conversation[] = [];

      // Process conversations from API
      if (conversationsResponse && Array.isArray(conversationsResponse)) {
        const apiConversations: Conversation[] = conversationsResponse.map(conv => ({
          id: conv.id,
          type: 'direct' as const,
          name: conv.name || 'Unknown User',
          participants: conv.participants || [],
          lastMessage: conv.lastMessage ? {
            id: conv.lastMessage.id,
            content: conv.lastMessage.content,
            authorId: conv.lastMessage.sender?.id || '',
            authorName: conv.lastMessage.sender?.username || 'Unknown',
            timestamp: conv.lastMessage.createdAt,
            type: conv.lastMessage.type as 'text' | 'image' | 'file' | 'system',
          } : undefined,
          unreadCount: 0, // This would need to be calculated from API
          isPinned: false,
          isMuted: false,
          avatar: conv.avatar,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        }));
        conversations.push(...apiConversations);
      }

      // Process direct messages if no conversations available
      if (conversations.length === 0 && messagesResponse && Array.isArray(messagesResponse)) {
        // Group messages by sender to create conversation-like view
        const messagesBySender = messagesResponse.reduce((acc, message) => {
          const senderId = message.sender?.id;
          if (senderId && senderId !== user?.id) {
            if (!acc[senderId]) {
              acc[senderId] = {
                sender: message.sender,
                messages: [],
                lastMessage: message,
              };
            }
            acc[senderId].messages.push(message);
            if (new Date(message.createdAt) > new Date(acc[senderId].lastMessage.createdAt)) {
              acc[senderId].lastMessage = message;
            }
          }
          return acc;
        }, {} as any);

        const directConversations: Conversation[] = Object.values(messagesBySender).map((conv: any) => ({
          id: conv.sender.id,
          type: 'direct' as const,
          name: conv.sender.username,
          participants: [
            {
              id: conv.sender.id,
              username: conv.sender.username,
              displayName: conv.sender.username,
              avatar: conv.sender.avatar,
              isOnline: false, // This would need to be fetched from API
            },
            {
              id: user?.id || 'me',
              username: user?.username || 'me',
              displayName: user?.username || 'Me',
              avatar: user?.avatar,
              isOnline: true,
            }
          ],
          lastMessage: {
            id: conv.lastMessage.id,
            content: conv.lastMessage.content,
            authorId: conv.lastMessage.sender.id,
            authorName: conv.lastMessage.sender.username,
            timestamp: conv.lastMessage.createdAt,
            type: conv.lastMessage.type as 'text' | 'image' | 'file' | 'system',
          },
          unreadCount: 0, // This would need to be calculated
          isPinned: false,
          isMuted: false,
          avatar: conv.sender.avatar,
          createdAt: conv.lastMessage.createdAt,
          updatedAt: conv.lastMessage.updatedAt,
        }));
        conversations.push(...directConversations);
      }

      setConversations(conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isConnected, isRefreshing, user]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadConversations();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [loadConversations]);

  const handleConversationPress = useCallback((conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (conversation.type === 'direct') {
      navigation.navigate('ChatRoom', {
        roomId: conversation.id,
        roomName: conversation.name,
      });
    } else if (conversation.type === 'channel') {
      navigation.navigate('ChatRoom', {
        roomId: conversation.id,
        roomName: `#${conversation.name}`,
      });
    }
  }, [navigation]);

  const handleConversationLongPress = useCallback((conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      conversation.name,
      'Choose an action',
      [
        {
          text: conversation.isPinned ? 'Unpin' : 'Pin',
          onPress: () => {
            // TODO: Implement pin/unpin functionality
            console.log('Pin/unpin conversation');
          },
        },
        {
          text: conversation.isMuted ? 'Unmute' : 'Mute',
          onPress: () => {
            // TODO: Implement mute/unmute functionality
            console.log('Mute/unmute conversation');
          },
        },
        {
          text: 'Mark as Read',
          onPress: () => {
            // TODO: Implement mark as read functionality
            console.log('Mark as read');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, []);

  const handleNewMessage = useCallback(() => {
    // TODO: Navigate to new message screen
    console.log('Start new message');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const renderConversationItem = useCallback(({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleConversationPress(item)}
      onLongPress={() => handleConversationLongPress(item)}
    />
  ), [handleConversationPress, handleConversationLongPress]);

  const renderHeader = useCallback(() => (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity
          style={[styles.newMessageButton, { backgroundColor: colors.primary }]}
          onPress={handleNewMessage}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search conversations..."
        containerStyle={{ marginVertical: spacing.md }}
      />

      <View style={styles.filterContainer}>
        {['all', 'unread', 'direct', 'groups'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterChip,
              { backgroundColor: colors.cardBackground },
              filter === filterOption && { backgroundColor: colors.primary }
            ]}
            onPress={() => setFilter(filterOption as typeof filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.textSecondary },
                filter === filterOption && { color: colors.textInverse }
              ]}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [colors, spacing, searchQuery, filter, handleNewMessage]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Conversations</Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {searchQuery.trim() 
          ? 'No conversations match your search'
          : 'Start a new conversation to get started'
        }
      </Text>
      {!searchQuery.trim() && (
        <Button
          title="Start New Conversation"
          onPress={handleNewMessage}
          variant="primary"
          size="md"
          style={{ marginTop: spacing.lg }}
        />
      )}
    </View>
  ), [colors, searchQuery, handleNewMessage, spacing]);

  const renderLoadingState = useCallback(() => (
    <View style={{ padding: spacing.md }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonLoader
          key={index}
          height={72}
          style={{ marginBottom: spacing.sm, borderRadius: 12 }}
        />
      ))}
    </View>
  ), [spacing]);

  if (isLoading && !conversations.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        {renderHeader()}
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={filteredConversations.length === 0 ? styles.emptyContent : undefined}
          />
        </Animated.View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={loadConversations}>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: typography.h3,
    fontWeight: '700',
  },
  newMessageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  filterText: {
    fontSize: typography.body2,
    fontWeight: '500',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  pinnedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    fontSize: typography.body1,
    fontWeight: '500',
    flex: 1,
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: typography.caption,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: typography.body2,
    flex: 1,
    marginRight: spacing.sm,
  },
  noMessages: {
    fontSize: typography.body2,
    fontStyle: 'italic',
  },
  serverInfo: {
    fontSize: typography.caption,
    marginTop: 2,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: typography.h5,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: typography.body2,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
  },
  errorText: {
    fontSize: typography.body2,
    flex: 1,
  },
  retryText: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
});

export { MessagesScreen };