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
import apiService from '../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

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

// Removed mock data - using real API now

const categories = ['All', 'Gaming', 'Technology', 'Finance', 'Entertainment', 'Education'];

export function CommunitiesScreen() {
  const navigation = useNavigation<CommunitiesScreenNavigationProp>();
  const { colors } = useTheme();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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

  // Load communities on component mount
  useEffect(() => {
    const loadInitialCommunities = async () => {
      await onRefresh();
      setInitialLoading(false);
    };
    
    loadInitialCommunities();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch communities from API
      const communitiesResponse = await apiService.getCommunities();
      if (communitiesResponse && Array.isArray(communitiesResponse)) {
        const apiCommunities: Community[] = communitiesResponse.map(community => ({
          id: community.id,
          name: community.name,
          description: community.description,
          memberCount: community.memberCount || 0,
          onlineMembers: 0, // This would need to be calculated from online members
          iconUrl: community.avatar,
          bannerUrl: community.banner,
          isJoined: community.isMember || false,
          category: 'General', // Default category if not provided
          tags: ['general'],
          isVerified: false, // Set based on community data if available
        }));
        setCommunities(apiCommunities);
      } else {
        setCommunities([]);
      }
    } catch (error) {
      console.error('Error refreshing communities:', error);
      setCommunities([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleJoinCommunity = useCallback(async (communityId: string) => {
    try {
      setLoading(true);
      
      // Check if user is already joined
      const community = communities.find(c => c.id === communityId);
      if (!community) return;

      if (community.isJoined) {
        // Leave community
        const response = await apiService.leaveCommunity(communityId);
        if (response) {
          setCommunities(prev => prev.map(c =>
            c.id === communityId
              ? { ...c, isJoined: false, memberCount: Math.max(0, c.memberCount - 1) }
              : c
          ));
        }
      } else {
        // Join community
        const response = await apiService.joinCommunity(communityId);
        if (response) {
          setCommunities(prev => prev.map(c =>
            c.id === communityId
              ? { ...c, isJoined: true, memberCount: c.memberCount + 1 }
              : c
          ));
        }
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error);
    } finally {
      setLoading(false);
    }
  }, [communities]);

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
            <Text
              style={[
                styles.joinButtonText,
                { color: item.isJoined ? colors.primary : '#ffffff' }
              ]}
            >
              {item.isJoined ? 'Joined' : 'Join'}
            </Text>
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

  if (initialLoading) {
    return null;
  }

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
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No communities found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: 'bold',
  },
  createButton: {
    padding: spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
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
  categoriesList: {
    marginBottom: spacing.lg,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  categoryItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  communityItem: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    overflow: 'hidden',
  },
  communityBanner: {
    width: '100%',
    height: 100,
  },
  communityContent: {
    padding: spacing.lg,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  communityInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: spacing.md,
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
    fontSize: typography.h6,
    fontWeight: 'bold',
  },
  communityCategory: {
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  joinButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  communityDescription: {
    fontSize: typography.body2,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  communityStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.caption,
  },
  communityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: typography.h5,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.body1,
    textAlign: 'center',
  },
});