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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { MainStackParamList } from '../navigation/MainNavigator';

type CommunitiesScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  iconUrl?: string;
  bannerUrl?: string;
  isJoined: boolean;
  category: string;
  tags: string[];
  isVerified: boolean;
  onlineMembers: number;
}

const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'Gaming Hub',
    description: 'The ultimate destination for gamers to discuss latest releases, share gameplay, and organize tournaments.',
    memberCount: 15420,
    onlineMembers: 892,
    iconUrl: 'https://via.placeholder.com/50',
    bannerUrl: 'https://via.placeholder.com/300x100',
    isJoined: true,
    category: 'Gaming',
    tags: ['gaming', 'esports', 'tournaments'],
    isVerified: true,
  },
  {
    id: '2',
    name: 'Crypto Traders',
    description: 'Professional cryptocurrency trading community with market analysis, signals, and educational content.',
    memberCount: 8950,
    onlineMembers: 234,
    iconUrl: 'https://via.placeholder.com/50',
    isJoined: false,
    category: 'Finance',
    tags: ['crypto', 'trading', 'bitcoin'],
    isVerified: true,
  },
  {
    id: '3',
    name: 'Tech Innovation',
    description: 'Explore cutting-edge technology, startup discussions, and innovation in the tech industry.',
    memberCount: 12500,
    onlineMembers: 445,
    iconUrl: 'https://via.placeholder.com/50',
    isJoined: true,
    category: 'Technology',
    tags: ['tech', 'startups', 'ai'],
    isVerified: false,
  },
];

const categories = ['All', 'Gaming', 'Technology', 'Finance', 'Entertainment', 'Education'];

export function CommunitiesScreen() {
  const navigation = useNavigation<CommunitiesScreenNavigationProp>();
  const { colors } = useTheme();

  const [communities, setCommunities] = useState<Community[]>(mockCommunities);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>(mockCommunities);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const filterCommunities = useCallback(() => {
    let filtered = communities;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(community => community.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(query) ||
        community.description.toLowerCase().includes(query) ||
        community.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredCommunities(filtered);
  }, [communities, selectedCategory, searchQuery]);

  useEffect(() => {
    filterCommunities();
  }, [filterCommunities]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: Fetch fresh data from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCommunities(mockCommunities);
    } catch (error) {
      console.error('Error refreshing communities:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleJoinCommunity = useCallback(async (communityId: string) => {
    try {
      setLoading(true);
      // TODO: API call to join community
      await new Promise(resolve => setTimeout(resolve, 500));

      setCommunities(prev => prev.map(community =>
        community.id === communityId
          ? { ...community, isJoined: !community.isJoined }
          : community
      ));
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCommunityPress = useCallback((community: Community) => {
    navigation.navigate('Server', {
      serverId: community.id,
      serverName: community.name,
    });
  }, [navigation]);

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        {
          backgroundColor: selectedCategory === item ? colors.primary : colors.surface,
          borderColor: selectedCategory === item ? colors.primary : colors.border,
        }
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          {
            color: selectedCategory === item ? '#ffffff' : colors.text,
          }
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderCommunityItem = ({ item }: { item: Community }) => (
    <TouchableOpacity
      style={[styles.communityItem, { backgroundColor: colors.card }]}
      onPress={() => handleCommunityPress(item)}
    >
      {item.bannerUrl && (
        <Image source={{ uri: item.bannerUrl }} style={styles.communityBanner} />
      )}

      <View style={styles.communityContent}>
        <View style={styles.communityHeader}>
          <View style={styles.communityInfo}>
            {item.iconUrl && (
              <Image source={{ uri: item.iconUrl }} style={styles.communityIcon} />
            )}
            <View style={styles.communityTitleContainer}>
              <View style={styles.communityNameRow}>
                <Text style={[styles.communityName, { color: colors.text }]}>
                  {item.name}
                </Text>
                {item.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.communityCategory, { color: colors.primary }]}>
                {item.category}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.joinButton,
              {
                backgroundColor: item.isJoined ? colors.surface : colors.primary,
                borderColor: colors.primary,
                borderWidth: item.isJoined ? 1 : 0,
              }
            ]}
            onPress={() => handleJoinCommunity(item.id)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.joinButtonText,
                  { color: item.isJoined ? colors.primary : '#ffffff' }
                ]}
              >
                {item.isJoined ? 'Joined' : 'Join'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.communityDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>

        <View style={styles.communityStats}>
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

        <View style={styles.communityTags}>
          {item.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.surface }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Communities</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateServer')}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search communities..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesList}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredCommunities}
        renderItem={renderCommunityItem}
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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
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
  categoriesList: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  communityItem: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  communityBanner: {
    width: '100%',
    height: 100,
  },
  communityContent: {
    padding: 16,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  communityInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  communityTitleContainer: {
    flex: 1,
  },
  communityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  communityCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  communityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  communityStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  communityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
});