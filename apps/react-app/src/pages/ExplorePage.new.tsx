import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Image as ImageIcon, Sparkles } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { SearchBar } from '../design-system/molecules/SearchBar';
import { UserCard } from '../design-system/organisms/UserCard';
import { NFTCard } from '../design-system/organisms/NFTCard';
import { CollectionCard } from '../design-system/organisms/CollectionCard';
import { PostCard } from '../design-system/molecules/PostCard';
import { Skeleton } from '../design-system/atoms/Skeleton';
import { Text } from '../design-system/atoms/Text';
import { colors, spacing, radii, typography } from '../design-system/tokens';

interface ExplorePageProps {
  onNavigate?: (route: string, params?: any) => void;
}

// Mock data generators
const generateMockCreator = (id: number) => ({
  id: `creator-${id}`,
  username: `creator${id}`,
  displayName: `Creator ${id}`,
  avatar: `https://i.pravatar.cc/150?u=creator${id}`,
  bio: 'Digital artist and NFT creator. Building the future of art.',
  isVerified: Math.random() > 0.5,
  followerCount: Math.floor(Math.random() * 50000) + 1000,
  followingCount: Math.floor(Math.random() * 1000) + 100,
  isFollowing: Math.random() > 0.7,
  mutualFollowers: Math.floor(Math.random() * 10),
});

const generateMockNFT = (id: number) => ({
  id: `nft-${id}`,
  imageUrl: `https://picsum.photos/400/400?random=nft${id}`,
  name: `Cool NFT #${id}`,
  collectionName: `Collection ${id % 5}`,
  creatorAvatar: `https://i.pravatar.cc/150?u=nftcreator${id}`,
  creatorName: `Creator ${id % 10}`,
  creatorVerified: Math.random() > 0.6,
  price: Math.random() > 0.3 ? { amount: (Math.random() * 5).toFixed(2), currency: 'ETH' } : undefined,
  lastSale: { amount: (Math.random() * 3).toFixed(2), currency: 'ETH' },
  likes: Math.floor(Math.random() * 500),
  views: Math.floor(Math.random() * 5000),
  isLiked: Math.random() > 0.7,
});

const generateMockCollection = (id: number) => ({
  id: `collection-${id}`,
  coverUrl: `https://picsum.photos/800/300?random=collection${id}`,
  avatarUrl: `https://i.pravatar.cc/150?u=collection${id}`,
  name: `Amazing Collection ${id}`,
  creatorName: `Creator ${id % 5}`,
  creatorAvatar: `https://i.pravatar.cc/150?u=collcreator${id}`,
  creatorVerified: true,
  itemCount: Math.floor(Math.random() * 10000) + 100,
  floorPrice: { amount: (Math.random() * 2).toFixed(2), currency: 'ETH' },
  volume: { amount: Math.floor(Math.random() * 1000), currency: 'ETH' },
  change24h: (Math.random() * 40 - 10).toFixed(1),
  isTrending: Math.random() > 0.5,
});

const generateMockPost = (id: number) => ({
  id: `post-${id}`,
  author: {
    username: `user${id}`,
    displayName: `User ${id}`,
    avatar: `https://i.pravatar.cc/150?u=post${id}`,
    isVerified: Math.random() > 0.7,
  },
  content: 'This is an amazing trending post! Check out what everyone is talking about.',
  createdAt: new Date(Date.now() - id * 3600000).toISOString(),
  likeCount: Math.floor(Math.random() * 5000) + 100,
  repostCount: Math.floor(Math.random() * 500) + 50,
  replyCount: Math.floor(Math.random() * 200) + 20,
  bookmarkCount: Math.floor(Math.random() * 300) + 30,
  isLiked: Math.random() > 0.5,
  media:
    Math.random() > 0.5
      ? [
          {
            type: 'IMAGE' as const,
            url: `https://picsum.photos/800/600?random=post${id}`,
            thumbnail: `https://picsum.photos/400/300?random=post${id}`,
          },
        ]
      : undefined,
});

const categories = [
  { id: 'all', label: 'All', icon: '🌟' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
];

export const ExplorePage: React.FC<ExplorePageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [trendingCreators, setTrendingCreators] = useState<any[]>([]);
  const [hotCollections, setHotCollections] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [newNFTs, setNewNFTs] = useState<any[]>([]);

  useEffect(() => {
    loadExploreData();
  }, [selectedCategory]);

  const loadExploreData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setTrendingCreators(Array.from({ length: 5 }, (_, i) => generateMockCreator(i)));
    setHotCollections(Array.from({ length: 3 }, (_, i) => generateMockCollection(i)));
    setTrendingPosts(Array.from({ length: 6 }, (_, i) => generateMockPost(i)));
    setNewNFTs(Array.from({ length: 8 }, (_, i) => generateMockNFT(i)));

    setIsLoading(false);
  };

  const handleSearch = (query: string) => {
    onNavigate?.(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <AppLayout
      activeTab="explore"
      onTabChange={(tab) => onNavigate?.(`/${tab}`)}
      onSearch={() => onNavigate?.('/search')}
      onNotifications={() => onNavigate?.('/notifications')}
      onWallet={() => onNavigate?.('/wallet')}
    >
      <div style={{ padding: spacing[4] }}>
        {/* Search Bar */}
        <div style={{ marginBottom: spacing[6] }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearch}
            placeholder="Search creators, collections, NFTs..."
          />
        </div>

        {/* Category Chips */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            overflowX: 'auto',
            marginBottom: spacing[8],
            paddingBottom: spacing[2],
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: isActive ? colors.brand.primary : colors.bg.elevated,
                  color: isActive ? colors.text.primary : colors.text.secondary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.bg.elevated;
                  }
                }}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Trending Creators */}
        <Section
          title="Trending Creators"
          icon={<Users size={20} />}
          actionLabel="View All"
          onAction={() => onNavigate?.('/explore/creators')}
        >
          {!isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {trendingCreators?.map((creator) => (
                <UserCard
                  key={creator.id}
                  {...creator}
                  variant="compact"
                  onClick={() => onNavigate?.(`/user/${creator.username}`)}
                  onFollow={() => console.log('Follow:', creator.id)}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Hot Collections */}
        <Section
          title="Hot Collections"
          icon={<TrendingUp size={20} />}
          actionLabel="View All"
          onAction={() => onNavigate?.('/explore/collections')}
        >
          {!isLoading && (
            <div
              style={{
                display: 'flex',
                gap: spacing[3],
                overflowX: 'auto',
                paddingBottom: spacing[2],
                scrollbarWidth: 'none',
              }}
            >
              {hotCollections?.map((collection) => (
                <div key={collection.id} style={{ minWidth: '280px' }}>
                  <CollectionCard
                    {...collection}
                    variant="default"
                    onClick={() => onNavigate?.(`/collection/${collection.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Trending Posts */}
        <Section
          title="Trending Posts"
          icon={<Sparkles size={20} />}
          actionLabel="View All"
          onAction={() => onNavigate?.('/trending')}
        >
          {!isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {trendingPosts?.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostClick={() => onNavigate?.(`/post/${post.id}`)}
                  onUserClick={() => onNavigate?.(`/user/${post.author.username}`)}
                />
              ))}
            </div>
          )}
        </Section>

        {/* New NFTs */}
        <Section
          title="New NFTs"
          icon={<ImageIcon size={20} />}
          actionLabel="View All"
          onAction={() => onNavigate?.('/explore/nfts')}
        >
          {!isLoading && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: spacing[3],
              }}
            >
              {newNFTs?.map((nft) => (
                <NFTCard
                  key={nft.id}
                  {...nft}
                  variant="compact"
                  onClick={() => onNavigate?.(`/nft/${nft.id}`)}
                  onLike={() => console.log('Like NFT:', nft.id)}
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    </AppLayout>
  );
};

// Section Component
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, actionLabel, onAction, children }) => {
  return (
    <section style={{ marginBottom: spacing[8] }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[4],
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <span style={{ color: colors.brand.primary }}>{icon}</span>
          <Text size="xl" weight="bold">
            {title}
          </Text>
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            style={{
              background: 'none',
              border: 'none',
              color: colors.brand.primary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              padding: spacing[2],
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
};

export default ExplorePage;
