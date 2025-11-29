import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SearchInput, SearchResults, Button } from '../components/ui';
import apiService from '../services/RealApiService';
import { Ionicons } from '@expo/vector-icons';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

interface SearchResult {
  id: string;
  type: 'post' | 'community' | 'user';
  title: string;
  content?: string;
  author?: string;
  timestamp?: string;
  imageUrl?: string;
  memberCount?: number;
  username?: string;
  avatar?: string;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  hasMore: boolean;
  totalCount: number;
  currentOffset: number;
  selectedType: 'all' | 'posts' | 'communities' | 'users';
}

export function SearchScreen() {
  const { colors, spacing, typography } = useTheme();
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    loading: false,
    hasMore: false,
    totalCount: 0,
    currentOffset: 0,
    selectedType: 'all',
  });

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filterTypes = [
    { key: 'all', label: 'All', icon: 'search' },
    { key: 'posts', label: 'Posts', icon: 'document-text' },
    { key: 'communities', label: 'Communities', icon: 'people' },
    { key: 'users', label: 'Users', icon: 'person' },
  ] as const;

  const performSearch = useCallback(async (
    query: string,
    type: typeof searchState.selectedType = 'all',
    offset: number = 0,
    append: boolean = false
  ) => {
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        results: [],
        loading: false,
        hasMore: false,
        totalCount: 0,
        currentOffset: 0,
      }));
      return;
    }

    setSearchState(prev => ({
      ...prev,
      loading: true,
    }));

    try {
      const response = await apiService.search(query, {
        type: type === 'all' ? undefined : type,
        limit: 20,
        offset,
      });

      const searchResults: SearchResult[] = [];
      let totalCount = 0;
      let hasMore = false;

      if (response) {
        // Process posts
        if (response.posts && Array.isArray(response.posts)) {
          const postResults: SearchResult[] = response.posts.map(post => ({
            id: post.id,
            type: 'post' as const,
            title: post.title,
            content: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
            author: post.author.username,
            timestamp: post.createdAt,
            imageUrl: post.images && post.images.length > 0 ? post.images[0] : undefined,
          }));
          searchResults.push(...postResults);
        }

        // Process communities
        if (response.communities && Array.isArray(response.communities)) {
          const communityResults: SearchResult[] = response.communities.map(community => ({
            id: community.id,
            type: 'community' as const,
            title: community.name,
            content: community.description,
            memberCount: community.memberCount,
            avatar: community.avatar,
          }));
          searchResults.push(...communityResults);
        }

        // Process users
        if (response.users && Array.isArray(response.users)) {
          const userResults: SearchResult[] = response.users.map(user => ({
            id: user.id,
            type: 'user' as const,
            title: user.username,
            content: user.bio,
            username: user.username,
            avatar: user.avatar,
          }));
          searchResults.push(...userResults);
        }

        totalCount = response.totalCount || searchResults.length;
        hasMore = response.hasMore || false;
      }
      
      setSearchState(prev => ({
        ...prev,
        results: append ? [...prev.results, ...searchResults] : searchResults,
        loading: false,
        hasMore,
        totalCount,
        currentOffset: offset + searchResults.length,
      }));

      // Add to recent searches if it's a new search
      if (!append && query.trim()) {
        setRecentSearches(prev => {
          const updated = [query, ...prev.filter(q => q !== query)].slice(0, 5);
          return updated;
        });
      }
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        loading: false,
        hasMore: false,
      }));
      
      Alert.alert('Search Error', 'Failed to perform search. Please try again.');
      console.error('Search error:', error);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchState(prev => ({
      ...prev,
      query,
      currentOffset: 0,
    }));
    
    performSearch(query, searchState.selectedType);
  }, [performSearch, searchState.selectedType]);

  const handleLoadMore = useCallback(() => {
    if (searchState.hasMore && !searchState.loading && searchState.query) {
      performSearch(
        searchState.query,
        searchState.selectedType,
        searchState.currentOffset,
        true
      );
    }
  }, [performSearch, searchState]);

  const handleFilterChange = (type: typeof searchState.selectedType) => {
    setSearchState(prev => ({
      ...prev,
      selectedType: type,
      currentOffset: 0,
    }));
    
    if (searchState.query) {
      performSearch(searchState.query, type);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    console.log('Result pressed:', result);
    // Navigate to appropriate screen based on result type
    // This would be implemented based on your navigation structure
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchState(prev => ({
      ...prev,
      query,
    }));
    handleSearch(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const renderRecentSearches = () => {
    if (recentSearches.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle(colors, typography)}>
            Recent Searches
          </Text>
          <TouchableOpacity onPress={clearRecentSearches}>
            <Text style={styles.clearButton(colors, typography)}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentSearches}
        >
          {recentSearches.map((query, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentSearchItem(colors, spacing)}
              onPress={() => handleRecentSearchPress(query)}
            >
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={styles.recentSearchText(colors, typography)}>
                {query}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filterTypes.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterItem(colors, spacing),
              searchState.selectedType === filter.key && styles.filterItemActive(colors),
            ]}
            onPress={() => handleFilterChange(filter.key)}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={
                searchState.selectedType === filter.key
                  ? colors.textInverse
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterText(colors, typography),
                searchState.selectedType === filter.key && styles.filterTextActive(colors),
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchSuggestions = () => {
    if (searchState.query || searchState.results.length > 0) return null;

    const suggestions = [
      'Latest posts',
      'Popular communities',
      'Technology discussions',
      'Gaming updates',
      'Art and design',
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle(colors, typography)}>
          Popular Searches
        </Text>
        
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionItem(colors, spacing)}
            onPress={() => handleSearch(suggestion)}
          >
            <Ionicons name="trending-up" size={16} color={colors.primary} />
            <Text style={styles.suggestionText(colors, typography)}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderResults = () => {
    if (!searchState.query) return null;

    return (
      <View style={styles.resultsContainer}>
        {searchState.totalCount > 0 && (
          <Text style={styles.resultsCount(colors, typography)}>
            {searchState.totalCount} results for "{searchState.query}"
          </Text>
        )}
        
        <SearchResults
          results={searchState.results}
          loading={searchState.loading}
          onResultPress={handleResultPress}
          onLoadMore={handleLoadMore}
          hasMore={searchState.hasMore}
          emptyMessage={`No ${searchState.selectedType === 'all' ? '' : searchState.selectedType + ' '}results found for "${searchState.query}"`}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container(colors)}>
      <View style={styles.header(colors, spacing)}>
        <SearchInput
          placeholder="Search posts, users, communities..."
          value={searchState.query}
          onSearch={handleSearch}
          autoFocus
          containerStyle={styles.searchInput}
        />
        
        <TouchableOpacity
          style={styles.filterToggle(colors, spacing)}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options"
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {showFilters && renderFilters()}

      <View style={styles.content}>
        {!searchState.query && renderRecentSearches()}
        {!searchState.query && renderSearchSuggestions()}
        {renderResults()}
      </View>
    </SafeAreaView>
  );
}

const styles = {
  container: (colors: any) => ({
    flex: 1,
    backgroundColor: colors.background,
  }),
  header: (colors: any, spacing: any) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }),
  searchInput: {
    flex: 1,
  },
  filterToggle: (colors: any, spacing: any) => ({
    marginLeft: spacing.sm,
    padding: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  }),
  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterItem: (colors: any, spacing: any) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  }),
  filterItemActive: (colors: any) => ({
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  }),
  filterText: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: 4,
  }),
  filterTextActive: (colors: any) => ({
    color: colors.textInverse,
  }),
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  sectionTitle: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  }),
  clearButton: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
  }),
  recentSearches: {
    paddingRight: 16,
  },
  recentSearchItem: (colors: any, spacing: any) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  }),
  recentSearchText: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.text,
    marginLeft: 6,
  }),
  suggestionItem: (colors: any, spacing: any) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
  }),
  suggestionText: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
  }),
  resultsContainer: {
    flex: 1,
  },
  resultsCount: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    padding: 16,
    paddingBottom: 8,
  }),
};