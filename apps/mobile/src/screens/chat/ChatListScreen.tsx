import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type ChatListScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

interface ChatItem {
  id: string;
  type: 'direct' | 'server' | 'group';
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
  avatarUrl?: string;
  participants?: number;
}

const mockChats: ChatItem[] = [
  {
    id: '1',
    type: 'direct',
    name: 'Alice Johnson',
    lastMessage: 'Hey, are you joining the gaming session tonight?',
    lastMessageTime: '2m ago',
    unreadCount: 2,
    isOnline: true,
    avatarUrl: 'https://via.placeholder.com/50',
  },
  {
    id: '2',
    type: 'server',
    name: 'Gaming Hub #general',
    lastMessage: 'New tournament announced for next week!',
    lastMessageTime: '15m ago',
    unreadCount: 0,
    participants: 156,
    avatarUrl: 'https://via.placeholder.com/50',
  },
  {
    id: '3',
    type: 'direct',
    name: 'Bob Smith',
    lastMessage: 'Thanks for the crypto tips yesterday',
    lastMessageTime: '1h ago',
    unreadCount: 0,
    isOnline: false,
    avatarUrl: 'https://via.placeholder.com/50',
  },
  {
    id: '4',
    type: 'group',
    name: 'Project Alpha Team',
    lastMessage: 'Sarah: The latest update is ready for review',
    lastMessageTime: '2h ago',
    unreadCount: 5,
    participants: 8,
    avatarUrl: 'https://via.placeholder.com/50',
  },
  {
    id: '5',
    type: 'server',
    name: 'Tech Innovation #random',
    lastMessage: 'Check out this new AI breakthrough',
    lastMessageTime: '3h ago',
    unreadCount: 1,
    participants: 89,
    avatarUrl: 'https://via.placeholder.com/50',
  },
];

export function ChatListScreen() {
  const navigation = useNavigation<ChatListScreenNavigationProp>();
  const { colors } = useTheme();

  const [chats, setChats] = useState<ChatItem[]>(mockChats);
  const [filteredChats, setFilteredChats] = useState<ChatItem[]>(mockChats);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filterChats = useCallback(() => {
    if (searchQuery.trim()) {
      const filtered = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [chats, searchQuery]);

  useEffect(() => {
    filterChats();
  }, [filterChats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: Fetch fresh data from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChats(mockChats);
    } catch (error) {
      console.error('Error refreshing chats:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleChatPress = useCallback((chat: ChatItem) => {
    if (chat.type === 'direct' || chat.type === 'group') {
      navigation.navigate('ChatRoom', {
        roomId: chat.id,
        roomName: chat.name,
      });
    } else if (chat.type === 'server') {
      navigation.navigate('Server', {
        serverId: chat.id,
        serverName: chat.name.split(' #')[0],
      });
    }
  }, [navigation]);

  const formatTime = (timeString: string): string => {
    return timeString;
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'direct':
        return 'person-circle';
      case 'group':
        return 'people-circle';
      case 'server':
        return 'server';
      default:
        return 'chatbubble-ellipses';
    }
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: colors.card }]}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.chatItemLeft}>
        <View style={styles.avatarContainer}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Ionicons 
                name={getTypeIcon(item.type) as any} 
                size={24} 
                color="#ffffff" 
              />
            </View>
          )}
          
          {item.type === 'direct' && (
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: item.isOnline ? colors.success : colors.border }
            ]} />
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.chatTime, { color: colors.textSecondary }]}>
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>

          <View style={styles.chatMessageRow}>
            <Text 
              style={[styles.lastMessage, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {item.participants && (
            <View style={styles.participantsContainer}>
              <Ionicons name="people" size={12} color={colors.textSecondary} />
              <Text style={[styles.participantsText, { color: colors.textSecondary }]}>
                {item.participants} members
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Chat', params: { screen: 'DirectMessages' } })}
        >
          <Ionicons name="person-add" size={20} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Communities' })}
        >
          <Ionicons name="add-circle" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  searchContainer: {
    marginBottom: spacing.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatItem: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
  },
  chatItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chatName: {
    fontSize: typography.body1,
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    fontSize: typography.caption,
    marginLeft: spacing.sm,
  },
  chatMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  lastMessage: {
    fontSize: typography.body2,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: typography.caption,
    fontWeight: 'bold',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  participantsText: {
    fontSize: 11,
  },
});