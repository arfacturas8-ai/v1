import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, LoadingSpinner } from './';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

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

interface SearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  onResultPress?: (result: SearchResult) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
  showCategories?: boolean;
}

interface SearchResultItemProps {
  result: SearchResult;
  onPress?: (result: SearchResult) => void;
}

function SearchResultItem({ result, onPress }: SearchResultItemProps) {
  const { colors, spacing, typography } = useTheme();

  const getResultIcon = () => {
    switch (result.type) {
      case 'post':
        return 'document-text';
      case 'user':
        return 'person';
      case 'community':
        return 'people';
      default:
        return 'search';
    }
  };

  const getResultTypeLabel = () => {
    switch (result.type) {
      case 'post':
        return 'Post';
      case 'user':
        return 'User';
      case 'community':
        return 'Community';
      default:
        return 'Result';
    }
  };

  const renderUserResult = () => (
    <View style={styles.userResult}>
      <Avatar
        size={40}
        source={result.avatar ? { uri: result.avatar } : undefined}
        name={result.username || result.title}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username(colors, typography)}>
          {result.title || result.username || 'Unknown User'}
        </Text>
        {result.username && result.title !== result.username && (
          <Text style={styles.userBio(colors, typography)}>
            @{result.username}
          </Text>
        )}
        {result.content && (
          <Text style={styles.userBio(colors, typography)} numberOfLines={2}>
            {result.content}
          </Text>
        )}
      </View>
    </View>
  );

  const renderCommunityResult = () => (
    <View style={styles.communityResult}>
      <Avatar
        size={40}
        source={result.avatar ? { uri: result.avatar } : undefined}
        name={result.title}
      />
      <View style={styles.communityInfo}>
        <Text style={styles.communityName(colors, typography)}>
          {result.title || 'Unknown Community'}
        </Text>
        {result.content && (
          <Text style={styles.communityDescription(colors, typography)} numberOfLines={2}>
            {result.content}
          </Text>
        )}
        {result.memberCount && (
          <Text style={styles.memberCount(colors, typography)}>
            {result.memberCount} members
          </Text>
        )}
      </View>
    </View>
  );

  const renderPostResult = () => (
    <View style={styles.postResult}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle(colors, typography)} numberOfLines={2}>
          {result.title || 'Untitled Post'}
        </Text>
        {result.author && (
          <View style={styles.authorInfo}>
            <Text style={styles.authorName(colors, typography)}>
              by {result.author}
            </Text>
          </View>
        )}
        {result.timestamp && (
          <Text style={styles.timestamp(colors, typography)}>
            {new Date(result.timestamp).toLocaleDateString()}
          </Text>
        )}
      </View>
      {result.content && (
        <Text style={styles.postContent(colors, typography)} numberOfLines={3}>
          {result.content}
        </Text>
      )}
      {result.imageUrl && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageIndicator(colors, typography)}>
            📷 Contains image
          </Text>
        </View>
      )}
    </View>
  );

  const renderResultContent = () => {
    switch (result.type) {
      case 'user':
        return renderUserResult();
      case 'community':
        return renderCommunityResult();
      case 'post':
        return renderPostResult();
      default:
        return (
          <View>
            <Text style={styles.defaultContent(colors, typography)}>
              {result.content || result.title || 'No content available'}
            </Text>
          </View>
        );
    }
  };

  return (
    <TouchableOpacity
      style={styles.resultItem(colors, spacing)}
      onPress={() => onPress?.(result)}
      activeOpacity={0.7}
    >
      <View style={styles.resultHeader}>
        <View style={styles.typeIndicator}>
          <Ionicons
            name={getResultIcon() as any}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.typeLabel(colors, typography)}>
            {getResultTypeLabel()}
          </Text>
        </View>
      </View>
      
      {renderResultContent()}
    </TouchableOpacity>
  );
}

export function SearchResults({
  results,
  loading = false,
  onResultPress,
  onLoadMore,
  hasMore = false,
  emptyMessage = "No results found",
  showCategories = false,
}: SearchResultsProps) {
  const { colors, spacing, typography } = useTheme();

  const renderItem = ({ item }: { item: SearchResult }) => (
    <SearchResultItem result={item} onPress={onResultPress} />
  );

  const renderFooter = () => {
    if (loading) {
      return null;
    }

    if (hasMore && results.length > 0) {
      return (
        <TouchableOpacity
          style={styles.loadMoreButton(colors, spacing)}
          onPress={onLoadMore}
        >
          <Text style={styles.loadMoreText(colors, typography)}>
            Load More Results
          </Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer(spacing)}>
        <Ionicons
          name="search"
          size={48}
          color={colors.textTertiary}
        />
        <Text style={styles.emptyText(colors, typography)}>
          {emptyMessage}
        </Text>
      </View>
    );
  };

  const groupedResults = showCategories ? groupResultsByType(results) : { all: results };

  if (showCategories && Object.keys(groupedResults).length > 1) {
    return (
      <View style={styles.container}>
        {Object.entries(groupedResults).map(([type, typeResults]) => (
          <View key={type} style={styles.categorySection}>
            <Text style={styles.categoryHeader(colors, typography)}>
              {type.charAt(0).toUpperCase() + type.slice(1)}s ({typeResults.length})
            </Text>
            <FlatList
              data={typeResults}
              renderItem={renderItem}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      renderItem={renderItem}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.1}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={results.length === 0 ? styles.emptyList : undefined}
    />
  );
}

function groupResultsByType(results: SearchResult[]) {
  return results.reduce((groups, result) => {
    const type = result.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(result);
    return groups;
  }, {} as Record<string, SearchResult[]>);
}

const styles = {
  container: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  }),
  resultItem: (colors: any, spacing: any) => ({
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  }),
  resultHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  typeIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  typeLabel: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
    marginLeft: 4,
  }),
  score: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  }),
  userResult: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  username: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  }),
  userBio: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  }),
  communityResult: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  communityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  communityName: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  }),
  communityDescription: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  }),
  memberCount: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    marginTop: 4,
    fontWeight: typography.fontWeights.medium,
  }),
  postResult: {},
  postHeader: {
    marginBottom: 8,
  },
  postTitle: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: 4,
  }),
  authorInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  authorName: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: 6,
  }),
  postContent: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.normal * typography.fontSizes.sm,
  }),
  timestamp: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
  }),
  imageContainer: {
    marginTop: 8,
  },
  imageIndicator: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontStyle: 'italic',
  }),
  defaultContent: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.text,
  }),
  emptyContainer: (spacing: any) => ({
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.xl,
  }),
  emptyText: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: spacing.md,
  }),
  loadingText: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: spacing.md,
  }),
  emptyList: {
    flexGrow: 1,
  },
  footer: (spacing: any) => ({
    padding: spacing.md,
    alignItems: 'center' as const,
  }),
  loadMoreButton: (colors: any, spacing: any) => ({
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    padding: spacing.sm,
    margin: spacing.md,
    alignItems: 'center' as const,
  }),
  loadMoreText: (colors: any, typography: any) => ({
    color: colors.textInverse,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
  }),
};