import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  blockedAt: string;
  reason?: string;
}

const BlockedUsersScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      // Mock data - replace with API call
      const mockBlockedUsers: BlockedUser[] = [
        {
          id: '1',
          username: 'spammer_123',
          displayName: 'Suspicious User',
          avatar: 'https://i.pravatar.cc/150?img=10',
          blockedAt: '2 days ago',
          reason: 'Spam',
        },
        {
          id: '2',
          username: 'troll_user',
          displayName: 'Annoying Person',
          avatar: 'https://i.pravatar.cc/150?img=11',
          blockedAt: '1 week ago',
          reason: 'Harassment',
        },
      ];

      setBlockedUsers(mockBlockedUsers);
    } catch (error) {
      console.error('Error loading blocked users:', error);
      Alert.alert('Error', 'Failed to load blocked users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Unblock @${user.username}? They will be able to interact with you again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              // API call to unblock user
              setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
              Alert.alert('Success', `@${user.username} has been unblocked`);
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const handleViewProfile = (user: BlockedUser) => {
    navigation.navigate('UserProfile' as never, { username: user.username } as never);
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userCard}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => handleViewProfile(item)}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />

        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.username}>@{item.username}</Text>
          {item.reason && (
            <Text style={styles.reason}>Reason: {item.reason}</Text>
          )}
          <Text style={styles.blockedAt}>Blocked {item.blockedAt}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item)}
      >
        <Text style={styles.unblockButtonText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Blocked users can't follow you, message you, or see your posts.
        </Text>
      </View>

      <FlatList
        data={blockedUsers}
        renderItem={renderBlockedUser}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadBlockedUsers}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🚫</Text>
            <Text style={styles.emptyStateTitle}>No Blocked Users</Text>
            <Text style={styles.emptyStateText}>
              You haven't blocked anyone yet.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              When you block someone, they'll appear here.
            </Text>
          </View>
        }
      />
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
  header: {
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
  },
  headerText: {
    fontSize: typography.body2,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
    opacity: 0.6,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  username: {
    fontSize: typography.body2,
    color: '#9CA3AF',
    marginBottom: spacing.xs,
  },
  reason: {
    fontSize: typography.caption,
    color: '#EF4444',
    marginBottom: 2,
  },
  blockedAt: {
    fontSize: typography.caption,
    color: '#6B7280',
  },
  unblockButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 8,
  },
  unblockButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: spacing.xxxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.h5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.body1,
    color: '#9CA3AF',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: typography.body2,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default BlockedUsersScreen;
