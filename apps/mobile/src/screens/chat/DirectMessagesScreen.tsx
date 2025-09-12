import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { MainStackParamList } from '../../navigation/MainNavigator';

type DirectMessagesScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
  avatarUrl?: string;
  status?: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'alice_johnson',
    isOnline: true,
    avatarUrl: 'https://via.placeholder.com/50',
    status: 'Playing Cyberpunk 2077',
  },
  {
    id: '2',
    username: 'bob_smith',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
    avatarUrl: 'https://via.placeholder.com/50',
  },
  {
    id: '3',
    username: 'charlie_brown',
    isOnline: true,
    avatarUrl: 'https://via.placeholder.com/50',
    status: 'Listening to Spotify',
  },
  {
    id: '4',
    username: 'diana_prince',
    isOnline: false,
    lastSeen: new Date(Date.now() - 86400000), // 1 day ago
    avatarUrl: 'https://via.placeholder.com/50',
  },
  {
    id: '5',
    username: 'erik_anderson',
    isOnline: true,
    avatarUrl: 'https://via.placeholder.com/50',
  },
];

export function DirectMessagesScreen() {
  const navigation = useNavigation<DirectMessagesScreenNavigationProp>();
  const { colors } = useTheme();

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [users]);

  const handleUserPress = useCallback((user: User) => {
    navigation.navigate('ChatRoom', {
      roomId: `dm-${user.id}`,
      roomName: user.username,
    });
  }, [navigation]);

  const handleStartGroupChat = useCallback(() => {
    Alert.alert(
      'Start Group Chat',
      'Group chat creation will be available soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const getLastSeenText = (user: User): string => {
    if (user.isOnline) {
      return user.status || 'Online';
    }
    
    if (!user.lastSeen) return 'Offline';

    const now = new Date();
    const diffMs = now.getTime() - user.lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return user.lastSeen.toLocaleDateString();
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: colors.card }]}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: item.isOnline ? colors.success : colors.border }
          ]} />
        </View>

        <View style={styles.userTextInfo}>
          <Text style={[styles.username, { color: colors.text }]}>
            {item.username}
          </Text>
          <Text
            style={[
              styles.status,
              {
                color: item.isOnline ? colors.success : colors.textSecondary,
              }
            ]}
          >
            {getLastSeenText(item)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.messageButton, { backgroundColor: colors.primary }]}
        onPress={() => handleUserPress(item)}
      >
        <Ionicons name="chatbubble" size={16} color="#ffffff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const onlineUsers = filteredUsers.filter(user => user.isOnline);
  const offlineUsers = filteredUsers.filter(user => !user.isOnline);

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {title} — {count}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search users..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.groupChatButton, { backgroundColor: colors.primary }]}
          onPress={handleStartGroupChat}
        >
          <Ionicons name="people" size={20} color="#ffffff" />
          <Text style={styles.groupChatButtonText}>Start Group</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            {onlineUsers.length > 0 && (
              <View>
                {renderSectionHeader('Online', onlineUsers.length)}
                <FlatList
                  data={onlineUsers}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => `online-${item.id}`}
                  scrollEnabled={false}
                />
              </View>
            )}

            {offlineUsers.length > 0 && (
              <View>
                {renderSectionHeader('Offline', offlineUsers.length)}
                <FlatList
                  data={offlineUsers}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => `offline-${item.id}`}
                  scrollEnabled={false}
                />
              </View>
            )}

            {filteredUsers.length === 0 && searchQuery.trim() && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="person" size={48} color={colors.textSecondary} />
                <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                  No users found matching "{searchQuery}"
                </Text>
              </View>
            )}
          </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  groupChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  groupChatButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userTextInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  status: {
    fontSize: 13,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});