import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  currency: string;
  creator: {
    username: string;
    avatar?: string;
  };
  collection: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

export default function NFTMarketplaceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'art', label: 'Art', icon: 'image' },
    { id: 'collectibles', label: 'Collectibles', icon: 'star' },
    { id: 'gaming', label: 'Gaming', icon: 'play' },
    { id: 'music', label: 'Music', icon: 'music' },
  ];

  const loadNFTs = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Fetch from API
      // const response = await fetch('/api/nft/marketplace');
      // const data = await response.json();
      // setNfts(data);

      // Mock data
      const mockNFTs: NFT[] = [
        {
          id: '1',
          name: 'Cool NFT #1',
          description: 'A unique digital collectible',
          image: 'https://via.placeholder.com/300',
          price: '0.5',
          currency: 'ETH',
          creator: { username: 'artist1', avatar: 'https://via.placeholder.com/50' },
          collection: 'Cool Collection',
          attributes: [
            { trait_type: 'Rarity', value: 'Rare' },
            { trait_type: 'Type', value: 'Art' },
          ],
        },
      ];
      setNfts(mockNFTs);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNFTs();
  }, [loadNFTs]);

  React.useEffect(() => {
    loadNFTs();
  }, [loadNFTs]);

  const renderNFTCard = ({ item }: { item: NFT }) => (
    <TouchableOpacity
      style={[styles.nftCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('NFTDetail' as never, { nftId: item.id } as never)}
    >
      <Image source={{ uri: item.image }} style={styles.nftImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      >
        <View style={styles.nftInfo}>
          <Text style={[styles.nftName, { color: '#fff' }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Feather name="zap" size={16} color="#FFD700" />
            <Text style={[styles.nftPrice, { color: '#FFD700' }]}>
              {item.price} {item.currency}
            </Text>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.creatorBadge}>
        {item.creator.avatar ? (
          <Image source={{ uri: item.creator.avatar }} style={styles.creatorAvatar} />
        ) : (
          <View style={[styles.creatorAvatar, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontSize: 12 }}>
              {item.creator.username[0].toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]}>NFT Marketplace</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Search' as never)}
        >
          <Feather name="search" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Wallet' as never)}
        >
          <Feather name="credit-card" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.id && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Feather
              name={item.icon as any}
              size={16}
              color={selectedCategory === item.id ? '#fff' : colors.text}
            />
            <Text
              style={[
                styles.categoryLabel,
                { color: selectedCategory === item.id ? '#fff' : colors.text },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {renderHeader()}
      {renderCategories()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={nfts}
          keyExtractor={(item) => item.id}
          renderItem={renderNFTCard}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No NFTs found
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    gap: 6,
  },
  categoryLabel: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.sm,
  },
  nftCard: {
    flex: 1,
    margin: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 200,
  },
  nftImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
  },
  nftInfo: {
    padding: spacing.md,
  },
  nftName: {
    fontSize: typography.body1,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nftPrice: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  creatorBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: typography.body1,
    marginTop: spacing.lg,
  },
});
