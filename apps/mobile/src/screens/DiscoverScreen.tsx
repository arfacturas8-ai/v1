import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, scale, deviceInfo } from '../utils/responsive';

interface Community {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  memberCount: number;
  category: string;
  isMember: boolean;
}

interface DiscoverScreenProps {
  navigation: any;
}

export function DiscoverScreen({ navigation }: DiscoverScreenProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [trending, setTrending] = useState<Community[]>([]);
  const [recommended, setRecommended] = useState<Community[]>([]);

  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'gaming', name: 'Gaming', icon: 'gamepad-2' },
    { id: 'tech', name: 'Tech', icon: 'cpu' },
    { id: 'crypto', name: 'Crypto', icon: 'dollar-sign' },
    { id: 'art', name: 'Art', icon: 'image' },
    { id: 'music', name: 'Music', icon: 'music' },
    { id: 'sports', name: 'Sports', icon: 'activity' },
  ];

  useEffect(() => {
    loadCommunities();
  }, [selectedCategory]);

  const loadCommunities = async () => {
    // TODO: Load from API
    const mockData: Community[] = [
      {
        id: '1',
        name: 'reactnative',
        description: 'Learn and share about React Native development',
        memberCount: 15234,
        category: 'tech',
        isMember: false,
      },
    ];
    setTrending(mockData);
    setRecommended(mockData);
  };

  const handleJoinCommunity = async (communityId: string) => {
    // TODO: Implement join/leave
    setTrending(prev =>
      prev.map(c => c.id === communityId ? { ...c, isMember: !c.isMember } : c)
    );
  };

  const renderCommunityCard = (community: Community) => (
    <TouchableOpacity
      key={community.id}
      onPress={() => navigation.navigate('CommunityDetail', {
        communityId: community.id,
        communityName: community.name,
      })}
      style={[styles.communityCard, { backgroundColor: colors.card }]}
    >
      <View style={styles.communityHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {community.name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>

        <View style={styles.communityInfo}>
          <Text style={[styles.communityName, { color: colors.text }]}>
            r/{community.name}
          </Text>
          <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
            {formatNumber(community.memberCount)} members
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleJoinCommunity(community.id)}
          style={[
            styles.joinButton,
            {
              backgroundColor: community.isMember ? 'transparent' : colors.primary,
              borderWidth: community.isMember ? 1 : 0,
              borderColor: colors.border,
            }
          ]}
        >
          <Text
            style={[
              styles.joinButtonText,
              { color: community.isMember ? colors.text : '#fff' }
            ]}
          >
            {community.isMember ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text
        style={[styles.description, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {community.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Feather name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search communities..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView>
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === category.id
                    ? colors.primary
                    : colors.card,
                }
              ]}
            >
              <Feather
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.id ? '#fff' : colors.text}
              />
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === category.id ? '#fff' : colors.text,
                  }
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Trending Communities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-up" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Trending Communities
            </Text>
          </View>

          {trending.map(renderCommunityCard)}
        </View>

        {/* Recommended */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="star" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recommended for You
            </Text>
          </View>

          {recommended.map(renderCommunityCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: scale(12),
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.body2,
  },
  categoriesContainer: {
    marginBottom: spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: scale(20),
    gap: spacing.xs,
  },
  categoryText: {
    fontSize: typography.body2,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: 'bold',
  },
  communityCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: scale(12),
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.h6,
    fontWeight: 'bold',
  },
  communityInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  communityName: {
    fontSize: typography.body1,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: typography.caption,
    marginTop: spacing.xs / 2,
  },
  joinButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(16),
  },
  joinButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  description: {
    fontSize: typography.body2,
    lineHeight: typography.body2 * 1.4,
  },
});
