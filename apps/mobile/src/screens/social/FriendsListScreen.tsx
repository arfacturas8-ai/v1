import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
  mutualFriends: number;
  status?: string;
}

interface FriendRequest {
  id: string;
  from: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  timestamp: string;
}

const FriendsListScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'suggestions'>('friends');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Friend[]>([]);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      // Mock data - replace with API call
      const mockFriends: Friend[] = [
        {
          id: '1',
          username: 'alice_crypto',
          displayName: 'Alice Johnson',
          avatar: 'https://i.pravatar.cc/150?img=1',
          isOnline: true,
          mutualFriends: 5,
          status: 'Building the future 🚀',
        },
        {
          id: '2',
          username: 'bob_nft',
          displayName: 'Bob Smith',
          avatar: 'https://i.pravatar.cc/150?img=2',
          isOnline: false,
          mutualFriends: 3,
        },
        {
          id: '3',
          username: 'charlie_dao',
          displayName: 'Charlie Brown',
          avatar: 'https://i.pravatar.cc/150?img=3',
          isOnline: true,
          mutualFriends: 8,
          status: 'GM! ☀️',
        },
      ];

      const mockRequests: FriendRequest[] = [
        {
          id: '1',
          from: {
            id: '4',
            username: 'dave_web3',
            displayName: 'Dave Wilson',
            avatar: 'https://i.pravatar.cc/150?img=4',
          },
          timestamp: '2 hours ago',
        },
      ];

      const mockSuggestions: Friend[] = [
        {
          id: '5',
          username: 'eve_defi',
          displayName: 'Eve Martinez',
          avatar: 'https://i.pravatar.cc/150?img=5',
          isOnline: false,
          mutualFriends: 12,
        },
        {
          id: '6',
          username: 'frank_nft',
          displayName: 'Frank Anderson',
          avatar: 'https://i.pravatar.cc/150?img=6',
          isOnline: true,
          mutualFriends: 7,
        },
      ];

      setFriends(mockFriends);
      setFriendRequests(mockRequests);
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // API call to accept friend request
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      Alert.alert('Success', 'Friend request accepted');
      loadFriends();
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      // API call to reject friend request
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      // API call to send friend request
      Alert.alert('Success', 'Friend request sent');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friend.displayName} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // API call to remove friend
              setFriends(prev => prev.filter(f => f.id !== friend.id));
              Alert.alert('Success', 'Friend removed');
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleMessageFriend = (friend: Friend) => {
    // Navigate to chat
    navigation.navigate('ChatRoom' as never, { userId: friend.id, username: friend.username } as never);
  };

  const filteredFriends = friends.filter(
    friend =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => navigation.navigate('UserProfile' as never, { username: item.username } as never)}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.displayName}</Text>
          <Text style={styles.friendUsername}>@{item.username}</Text>
          {item.status && <Text style={styles.friendStatus}>{item.status}</Text>}
          <Text style={styles.mutualFriends}>{item.mutualFriends} mutual friends</Text>
        </View>
      </View>

      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleMessageFriend(item)}
        >
          <Text style={styles.actionButtonText}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemoveFriend(item)}
        >
          <Text style={styles.actionButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      <Image source={{ uri: item.from.avatar }} style={styles.avatar} />

      <View style={styles.requestInfo}>
        <Text style={styles.friendName}>{item.from.displayName}</Text>
        <Text style={styles.friendUsername}>@{item.from.username}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.requestButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item.id)}
        >
          <Text style={styles.rejectButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuggestion = ({ item }: { item: Friend }) => (
    <View style={styles.suggestionCard}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />

      <View style={styles.suggestionInfo}>
        <Text style={styles.friendName}>{item.displayName}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
        <Text style={styles.mutualFriends}>{item.mutualFriends} mutual friends</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddFriend(item.id)}
      >
        <Text style={styles.addButtonText}>Add Friend</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({friendRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'suggestions' && styles.activeTab]}
          onPress={() => setActiveTab('suggestions')}
        >
          <Text style={[styles.tabText, activeTab === 'suggestions' && styles.activeTabText]}>
            Suggestions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'friends' && (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriend}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadFriends} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No friends yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start connecting with people!
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={friendRequests}
          renderItem={renderFriendRequest}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadFriends} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No pending requests</Text>
            </View>
          }
        />
      )}

      {activeTab === 'suggestions' && (
        <FlatList
          data={suggestions}
          renderItem={renderSuggestion}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadFriends} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No suggestions available</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    margin: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
  },
  searchIcon: {
    fontSize: typography.h6,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body1,
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: '#1F2937',
    marginHorizontal: spacing.xs,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: typography.body2,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.md,
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 14,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: typography.body2,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: typography.body2,
    color: '#6B7280',
    marginBottom: 2,
  },
  mutualFriends: {
    fontSize: typography.caption,
    color: '#6B7280',
  },
  friendActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 18,
  },
  actionButtonText: {
    fontSize: typography.body1,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.md,
  },
  requestInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  timestamp: {
    fontSize: typography.caption,
    color: '#6B7280',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  requestButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4F46E5',
  },
  acceptButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButton: {
    backgroundColor: '#374151',
  },
  rejectButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.md,
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.body2,
    color: '#6B7280',
  },
});

export default FriendsListScreen;
