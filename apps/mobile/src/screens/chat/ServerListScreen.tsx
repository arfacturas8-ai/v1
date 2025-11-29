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
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type ServerListScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

interface Server {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  onlineMembers: number;
  isJoined: boolean;
  hasUnread: boolean;
  category: string;
  isVerified: boolean;
}

const mockServers: Server[] = [
  {
    id: '1',
    name: 'Gaming Hub',
    description: 'The ultimate destination for gamers worldwide',
    iconUrl: 'https://via.placeholder.com/50',
    bannerUrl: 'https://via.placeholder.com/300x100',
    memberCount: 15420,
    onlineMembers: 892,
    isJoined: true,
    hasUnread: true,
    category: 'Gaming',
    isVerified: true,
  },
  {
    id: '2',
    name: 'Crypto Traders',
    description: 'Professional cryptocurrency trading community',
    iconUrl: 'https://via.placeholder.com/50',
    memberCount: 8950,
    onlineMembers: 234,
    isJoined: true,
    hasUnread: false,
    category: 'Finance',
    isVerified: true,
  },
  {
    id: '3',
    name: 'Tech Innovation',
    description: 'Exploring cutting-edge technology and startups',
    iconUrl: 'https://via.placeholder.com/50',
    memberCount: 12500,
    onlineMembers: 445,
    isJoined: false,
    hasUnread: false,
    category: 'Technology',
    isVerified: false,
  },
  {
    id: '4',
    name: 'NFT Collectors',
    description: 'Share and discuss your NFT collections',
    iconUrl: 'https://via.placeholder.com/50',
    memberCount: 5600,
    onlineMembers: 127,
    isJoined: true,
    hasUnread: true,
    category: 'Art',
    isVerified: false,
  },
];

export function ServerListScreen() {
  const navigation = useNavigation<ServerListScreenNavigationProp>();
  const { colors } = useTheme();

  const [servers, setServers] = useState<Server[]>(mockServers);
  const [filteredServers, setFilteredServers] = useState<Server[]>(mockServers);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = servers.filter(server =>
        server.name.toLowerCase().includes(query.toLowerCase()) ||
        server.description.toLowerCase().includes(query.toLowerCase()) ||
        server.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredServers(filtered);
    } else {
      setFilteredServers(servers);
    }
  }, [servers]);

  const handleServerPress = useCallback((server: Server) => {
    if (server.isJoined) {
      navigation.navigate('Server', {
        serverId: server.id,
        serverName: server.name,
      });
    } else {
      Alert.alert(
        'Join Server',
        `Would you like to join ${server.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join',
            onPress: () => {
              // TODO: Implement join server API call
              setServers(prev => prev.map(s =>
                s.id === server.id ? { ...s, isJoined: true } : s
              ));
              Alert.alert('Success', `You have joined ${server.name}!`);
            },
          },
        ]
      );
    }
  }, [navigation]);

  const handleCreateServer = useCallback(() => {
    navigation.navigate('CreateServer');
  }, [navigation]);

  const handleJoinByInvite = useCallback(() => {
    Alert.alert(
      'Join by Invite',
      'Enter server invite code:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => {
            Alert.alert('Coming Soon', 'Invite system will be available soon!');
          },
        },
      ]
    );
  }, []);

  const renderServerItem = ({ item }: { item: Server }) => (
    <TouchableOpacity
      style={[styles.serverItem, { backgroundColor: colors.card }]}
      onPress={() => handleServerPress(item)}
    >
      {item.bannerUrl && (
        <Image source={{ uri: item.bannerUrl }} style={styles.serverBanner} />
      )}

      <View style={styles.serverContent}>
        <View style={styles.serverHeader}>
          <View style={styles.serverInfo}>
            {item.iconUrl ? (
              <Image source={{ uri: item.iconUrl }} style={styles.serverIcon} />
            ) : (
              <View style={[styles.serverIconPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.serverIconText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.serverTitleContainer}>
              <View style={styles.serverNameRow}>
                <Text style={[styles.serverName, { color: colors.text }]}>
                  {item.name}
                </Text>
                {item.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                )}
                {item.hasUnread && (
                  <View style={[styles.unreadIndicator, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={[styles.serverCategory, { color: colors.primary }]}>
                {item.category}
              </Text>
            </View>
          </View>

          <View style={styles.serverActions}>
            {item.isJoined ? (
              <View style={[styles.joinedBadge, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={16} color="#ffffff" />
                <Text style={styles.joinedText}>Joined</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.joinButton, { backgroundColor: colors.primary }]}
                onPress={() => handleServerPress(item)}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[styles.serverDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>

        <View style={styles.serverStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.memberCount.toLocaleString()} members
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="radio" size={14} color={colors.success} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.onlineMembers} online
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const joinedServers = filteredServers.filter(server => server.isJoined);
  const discoverableServers = filteredServers.filter(server => !server.isJoined);

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {title} ({count})
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
              placeholder="Search servers..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateServer}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Create</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
            onPress={handleJoinByInvite}
          >
            <Ionicons name="link" size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            {joinedServers.length > 0 && (
              <View>
                {renderSectionHeader('Your Servers', joinedServers.length)}
                <FlatList
                  data={joinedServers}
                  renderItem={renderServerItem}
                  keyExtractor={(item) => `joined-${item.id}`}
                  scrollEnabled={false}
                />
              </View>
            )}

            {discoverableServers.length > 0 && (
              <View>
                {renderSectionHeader('Discover', discoverableServers.length)}
                <FlatList
                  data={discoverableServers}
                  renderItem={renderServerItem}
                  keyExtractor={(item) => `discover-${item.id}`}
                  scrollEnabled={false}
                />
              </View>
            )}

            {filteredServers.length === 0 && searchQuery.trim() && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="server" size={48} color={colors.textSecondary} />
                <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                  No servers found matching "{searchQuery}"
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
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    gap: spacing.sm,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: typography.body1,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: 'bold',
  },
  serverItem: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    overflow: 'hidden',
  },
  serverBanner: {
    width: '100%',
    height: 100,
  },
  serverContent: {
    padding: spacing.lg,
  },
  serverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  serverInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  serverIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  serverIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  serverIconText: {
    color: '#ffffff',
    fontSize: typography.h5,
    fontWeight: 'bold',
  },
  serverTitleContainer: {
    flex: 1,
  },
  serverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  serverName: {
    fontSize: typography.h6,
    fontWeight: 'bold',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverCategory: {
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  serverActions: {
    marginLeft: spacing.md,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
    gap: spacing.xs,
  },
  joinedText: {
    color: '#ffffff',
    fontSize: typography.caption,
    fontWeight: '600',
  },
  joinButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: typography.body2,
    fontWeight: '600',
  },
  serverDescription: {
    fontSize: typography.body2,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  serverStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.caption,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xxxl,
  },
  noResultsText: {
    fontSize: typography.body1,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});