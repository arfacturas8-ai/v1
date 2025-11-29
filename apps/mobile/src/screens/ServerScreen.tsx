import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import apiService from '../services/RealApiService';
import { useSocketStore } from '../stores/socketStore';
import { MainStackParamList } from '../navigation/MainNavigator';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

type ServerRouteProp = RouteProp<MainStackParamList, 'Server'>;
type ServerNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Server'>;

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  unreadCount?: number;
  isLocked?: boolean;
  description?: string;
}

interface Member {
  id: string;
  username: string;
  isOnline: boolean;
  role: 'admin' | 'moderator' | 'member';
  avatarUrl?: string;
  status?: string;
}

interface ServerInfo {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  onlineCount: number;
  isJoined: boolean;
  userRole: 'admin' | 'moderator' | 'member' | null;
}

// Mock data removed - data will be loaded from API

export function ServerScreen() {
  const route = useRoute<ServerRouteProp>();
  const navigation = useNavigation<ServerNavigationProp>();
  const { colors } = useTheme();

  const { serverId, serverName } = route.params;

  const [serverInfo, setServerInfo] = useState<ServerInfo>({
    id: serverId,
    name: serverName,
    description: 'A vibrant community for gamers, developers, and tech enthusiasts.',
    iconUrl: 'https://via.placeholder.com/60',
    bannerUrl: 'https://via.placeholder.com/400x150',
    memberCount: 1542,
    onlineCount: 89,
    isJoined: true,
    userRole: 'member',
  });

  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load server data on mount
  React.useEffect(() => {
    loadServerData();
  }, [serverId]);

  const loadServerData = async () => {
    try {
      setIsLoading(true);
      
      // Load server info
      const serverResponse = await apiService.getServer(serverId);
      if (serverResponse.success && serverResponse.data) {
        setServerInfo(serverResponse.data);
      }
      
      // Load channels
      const channelsResponse = await apiService.getChannels(serverId);
      if (channelsResponse.success && channelsResponse.data) {
        setChannels(channelsResponse.data);
      }
      
    } catch (error) {
      console.error('Error loading server data:', error);
      Alert.alert('Error', 'Failed to load server data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadServerData();
    } catch (error) {
      console.error('Error refreshing server:', error);
    } finally {
      setRefreshing(false);
    }
  }, [serverId]);

  const handleChannelPress = useCallback((channel: Channel) => {
    if (channel.isLocked && serverInfo.userRole === 'member') {
      Alert.alert('Access Denied', 'You don\'t have permission to access this channel.');
      return;
    }

    if (channel.type === 'voice') {
      Alert.alert('Voice Channel', 'Voice channels will be available in the next update!');
      return;
    }

    navigation.navigate('ChatRoom', {
      roomId: `${serverId}-${channel.id}`,
      roomName: `${serverName} #${channel.name}`,
    });
  }, [navigation, serverId, serverName, serverInfo.userRole]);

  const handleMemberPress = useCallback((member: Member) => {
    const actions = [
      { text: 'View Profile', onPress: () => Alert.alert('Coming Soon', 'User profiles will be available soon!') },
      { text: 'Send Message', onPress: () => navigation.navigate('ChatRoom', { roomId: `dm-${member.id}`, roomName: member.username }) },
    ];

    if (serverInfo.userRole === 'admin' || serverInfo.userRole === 'moderator') {
      actions.push(
        { text: 'Manage User', onPress: () => Alert.alert('Coming Soon', 'User management will be available soon!') }
      );
    }

    actions.push({ text: 'Cancel', onPress: () => {} });

    Alert.alert(member.username, `Role: ${member.role}`, actions);
  }, [navigation, serverInfo.userRole]);

  const handleServerOptions = useCallback(() => {
    const actions = [];

    if (serverInfo.userRole === 'admin') {
      actions.push(
        { text: 'Server Settings', onPress: () => Alert.alert('Coming Soon', 'Server settings will be available soon!') },
        { text: 'Manage Channels', onPress: () => Alert.alert('Coming Soon', 'Channel management will be available soon!') },
        { text: 'Manage Members', onPress: () => Alert.alert('Coming Soon', 'Member management will be available soon!') }
      );
    }

    actions.push(
      { text: 'Invite Members', onPress: () => Alert.alert('Coming Soon', 'Invite system will be available soon!') },
      { text: 'Leave Server', onPress: () => {
        Alert.alert(
          'Leave Server',
          `Are you sure you want to leave ${serverInfo.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
          ]
        );
      }},
      { text: 'Cancel', onPress: () => {} }
    );

    Alert.alert('Server Options', '', actions);
  }, [serverInfo, navigation]);

  const getChannelIcon = (type: string, isLocked?: boolean): string => {
    if (isLocked) return 'lock-closed';
    switch (type) {
      case 'voice':
        return 'volume-high';
      case 'announcement':
        return 'megaphone';
      default:
        return 'chatbubble-ellipses';
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return '#ff6b6b';
      case 'moderator':
        return '#4ecdc4';
      default:
        return colors.textSecondary;
    }
  };

  const renderChannel = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      style={[styles.channelItem, { backgroundColor: colors.card }]}
      onPress={() => handleChannelPress(item)}
    >
      <View style={styles.channelInfo}>
        <Ionicons
          name={getChannelIcon(item.type, item.isLocked) as any}
          size={20}
          color={item.isLocked ? colors.warning : colors.textSecondary}
        />
        <Text style={[styles.channelName, { color: colors.text }]}>
          {item.name}
        </Text>
      </View>

      {item.unreadCount && item.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.unreadText}>
            {item.unreadCount > 99 ? '99+' : item.unreadCount}
          </Text>
        </View>
      )}

      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderMember = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={[styles.memberItem, { backgroundColor: colors.card }]}
      onPress={() => handleMemberPress(item)}
    >
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatarContainer}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.memberAvatar} />
          ) : (
            <View style={[styles.memberAvatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.memberAvatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[
            styles.memberOnlineIndicator,
            { backgroundColor: item.isOnline ? colors.success : colors.border }
          ]} />
        </View>

        <View style={styles.memberTextInfo}>
          <Text style={[styles.memberName, { color: getRoleColor(item.role) }]}>
            {item.username}
          </Text>
          {item.status && (
            <Text style={[styles.memberStatus, { color: colors.textSecondary }]}>
              {item.status}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.roleBadge, { backgroundColor: colors.surface }]}>
        <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
          {item.role}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Server Banner */}
      {serverInfo.bannerUrl && (
        <Image source={{ uri: serverInfo.bannerUrl }} style={styles.serverBanner} />
      )}

      {/* Server Info */}
      <View style={[styles.serverInfoContainer, { backgroundColor: colors.card }]}>
        <View style={styles.serverHeaderRow}>
          <View style={styles.serverBasicInfo}>
            {serverInfo.iconUrl && (
              <Image source={{ uri: serverInfo.iconUrl }} style={styles.serverIcon} />
            )}
            <View style={styles.serverTitleContainer}>
              <Text style={[styles.serverName, { color: colors.text }]}>
                {serverInfo.name}
              </Text>
              <Text style={[styles.serverDescription, { color: colors.textSecondary }]}>
                {serverInfo.description}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.optionsButton}
            onPress={handleServerOptions}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.serverStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {serverInfo.memberCount} members
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="radio" size={16} color={colors.success} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {serverInfo.onlineCount} online
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const textChannels = channels.filter(c => c.type === 'text' || c.type === 'announcement');
  const voiceChannels = channels.filter(c => c.type === 'voice');
  const onlineMembers = members.filter(m => m.isOnline);
  const offlineMembers = members.filter(m => !m.isOnline);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            {renderHeader()}

            {/* Text Channels */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Text Channels
              </Text>
              <FlatList
                data={textChannels}
                renderItem={renderChannel}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>

            {/* Voice Channels */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Voice Channels
              </Text>
              <FlatList
                data={voiceChannels}
                renderItem={renderChannel}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>

            {/* Online Members */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Online — {onlineMembers.length}
              </Text>
              <FlatList
                data={onlineMembers}
                renderItem={renderMember}
                keyExtractor={(item) => `online-${item.id}`}
                scrollEnabled={false}
              />
            </View>

            {/* Offline Members */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Offline — {offlineMembers.length}
              </Text>
              <FlatList
                data={offlineMembers.slice(0, 10)} // Limit offline members shown
                renderItem={renderMember}
                keyExtractor={(item) => `offline-${item.id}`}
                scrollEnabled={false}
              />
            </View>
          </View>
        }
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
  serverBanner: {
    width: '100%',
    height: 150,
  },
  serverInfoContainer: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  serverHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  serverBasicInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  serverIcon: {
    width: 60,
    height: 60,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginRight: spacing.lg,
  },
  serverTitleContainer: {
    flex: 1,
  },
  serverName: {
    fontSize: typography.h5,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  serverDescription: {
    fontSize: typography.body2,
    lineHeight: 20,
  },
  optionsButton: {
    padding: spacing.sm,
  },
  serverStats: {
    flexDirection: 'row',
    gap: spacing.xxl,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: typography.body2,
  },
  section: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.body1,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  channelName: {
    fontSize: typography.body1,
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: spacing.sm,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: typography.caption,
    fontWeight: 'bold',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  memberAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: '#ffffff',
    fontSize: typography.body2,
    fontWeight: 'bold',
  },
  memberOnlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  memberTextInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.body2,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: typography.caption,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});