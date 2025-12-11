import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Share from 'react-native-share';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width } = Dimensions.get('window');

interface NFTDetail {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  currency: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  owner: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  collection: {
    name: string;
    verified: boolean;
  };
  attributes: Array<{ trait_type: string; value: string }>;
  contractAddress: string;
  tokenId: string;
  blockchain: string;
  royalty: number;
}

export default function NFTDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { nftId } = route.params as { nftId: string };

  const [nft, setNft] = useState<NFTDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadNFTDetail();
  }, [nftId]);

  const loadNFTDetail = async () => {
    try {
      // TODO: Fetch from API
      // const response = await fetch(`/api/nft/${nftId}`);
      // const data = await response.json();
      // setNft(data);

      // Mock data
      const mockNFT: NFTDetail = {
        id: nftId,
        name: 'Cool NFT #1',
        description:
          'A unique digital collectible from the Cool Collection. This NFT represents ownership of a one-of-a-kind piece of digital art.',
        image: 'https://via.placeholder.com/600',
        price: '0.5',
        currency: 'ETH',
        creator: {
          id: '1',
          username: 'artist1',
          displayName: 'Artist One',
          avatar: 'https://via.placeholder.com/50',
        },
        owner: {
          id: '2',
          username: 'collector1',
          displayName: 'Collector One',
          avatar: 'https://via.placeholder.com/50',
        },
        collection: {
          name: 'Cool Collection',
          verified: true,
        },
        attributes: [
          { trait_type: 'Rarity', value: 'Rare' },
          { trait_type: 'Type', value: 'Art' },
          { trait_type: 'Background', value: 'Blue' },
          { trait_type: 'Edition', value: '1/100' },
        ],
        contractAddress: '0x1234567890abcdef',
        tokenId: '1',
        blockchain: 'Ethereum',
        royalty: 10,
      };
      setNft(mockNFT);
    } catch (error) {
      console.error('Error loading NFT:', error);
      Alert.alert('Error', 'Failed to load NFT details');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.open({
        title: `Check out ${nft?.name}`,
        message: `${nft?.name} on CRYB NFT Marketplace`,
        url: `https://cryb.ai/nft/${nftId}`,
      });
    } catch (error) {
      console.log('Share cancelled');
    }
  };

  const handlePurchase = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Purchase NFT',
      `Do you want to purchase ${nft?.name} for ${nft?.price} ${nft?.currency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            // TODO: Implement purchase flow
            navigation.navigate('NFTPurchase' as never, { nftId } as never);
          },
        },
      ]
    );
  };

  const handleMakeOffer = () => {
    navigation.navigate('NFTMakeOffer' as never, { nftId } as never);
  };

  if (loading || !nft) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.card }]}
            onPress={handleShare}
          >
            <Feather name="share-2" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.card }]}
            onPress={handleFavorite}
          >
            <Feather
              name="heart"
              size={20}
              color={isFavorite ? '#FF6B6B' : colors.text}
              fill={isFavorite ? '#FF6B6B' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: nft.image }} style={styles.nftImage} />

        <View style={styles.content}>
          {/* Collection */}
          <View style={styles.collectionRow}>
            <Text style={[styles.collectionName, { color: colors.primary }]}>
              {nft.collection.name}
            </Text>
            {nft.collection.verified && (
              <Feather name="check-circle" size={16} color={colors.primary} />
            )}
          </View>

          {/* Title */}
          <Text style={[styles.nftTitle, { color: colors.text }]}>{nft.name}</Text>

          {/* Owner & Creator */}
          <View style={styles.peopleRow}>
            <View style={styles.personInfo}>
              <Text style={[styles.personLabel, { color: colors.textSecondary }]}>Owner</Text>
              <View style={styles.personRow}>
                <Image
                  source={{ uri: nft.owner.avatar || 'https://via.placeholder.com/32' }}
                  style={styles.personAvatar}
                />
                <Text style={[styles.personName, { color: colors.text }]}>
                  {nft.owner.displayName}
                </Text>
              </View>
            </View>
            <View style={styles.personInfo}>
              <Text style={[styles.personLabel, { color: colors.textSecondary }]}>Creator</Text>
              <View style={styles.personRow}>
                <Image
                  source={{ uri: nft.creator.avatar || 'https://via.placeholder.com/32' }}
                  style={styles.personAvatar}
                />
                <Text style={[styles.personName, { color: colors.text }]}>
                  {nft.creator.displayName}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {nft.description}
            </Text>
          </View>

          {/* Attributes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Attributes</Text>
            <View style={styles.attributesGrid}>
              {nft.attributes.map((attr, index) => (
                <View
                  key={index}
                  style={[styles.attributeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={[styles.attributeType, { color: colors.textSecondary }]}>
                    {attr.trait_type}
                  </Text>
                  <Text style={[styles.attributeValue, { color: colors.text }]}>
                    {attr.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
            <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
              <DetailRow label="Contract Address" value={nft.contractAddress} colors={colors} />
              <DetailRow label="Token ID" value={nft.tokenId} colors={colors} />
              <DetailRow label="Blockchain" value={nft.blockchain} colors={colors} />
              <DetailRow label="Creator Royalty" value={`${nft.royalty}%`} colors={colors} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Purchase Footer */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Current Price</Text>
          <View style={styles.priceRow}>
            <Feather name="zap" size={20} color="#FFD700" />
            <Text style={[styles.price, { color: colors.text }]}>
              {nft.price} {nft.currency}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.offerButton, { borderColor: colors.primary }]}
            onPress={handleMakeOffer}
          >
            <Text style={[styles.offerButtonText, { color: colors.primary }]}>Make Offer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyButton, { backgroundColor: colors.primary }]}
            onPress={handlePurchase}
          >
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
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
    paddingVertical: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftImage: {
    width,
    height: width,
    resizeMode: 'cover',
  },
  content: {
    padding: spacing.lg,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  collectionName: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  nftTitle: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  peopleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  personInfo: {
    flex: 1,
  },
  personLabel: {
    fontSize: typography.caption,
    marginBottom: spacing.sm,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  personAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  personName: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.body2,
    lineHeight: 20,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  attributeCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    borderWidth: 1,
    margin: '1%',
  },
  attributeType: {
    fontSize: typography.caption,
    marginBottom: spacing.xs,
  },
  attributeValue: {
    fontSize: typography.body1,
    fontWeight: '600',
  },
  detailsCard: {
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.body2,
  },
  detailValue: {
    fontSize: typography.body2,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.lg,
  },
  footer: {
    borderTopWidth: 1,
    padding: spacing.lg,
  },
  priceContainer: {
    marginBottom: spacing.md,
  },
  priceLabel: {
    fontSize: typography.caption,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: typography.h4,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  offerButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerButtonText: {
    fontSize: typography.body1,
    fontWeight: 'bold',
  },
  buyButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: typography.body1,
    fontWeight: 'bold',
    color: '#fff',
  },
});
