import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Hash, Users, Image as ImageIcon, Video } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';
import { SegmentedControl } from '../design-system/molecules/SegmentedControl';

type TrendingCategory = 'all' | 'hashtags' | 'posts' | 'communities' | 'nfts';

interface TrendingHashtag {
  id: string;
  tag: string;
  postCount: number;
  change: number;
}

interface TrendingPost {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    isVerified: boolean;
  };
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  likes: number;
  comments: number;
  reposts: number;
  views: number;
}

interface TrendingCommunity {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  memberCount: number;
  growthRate: number;
  isPrivate: boolean;
}

interface TrendingNFT {
  id: string;
  name: string;
  collectionName: string;
  imageUrl: string;
  floorPrice: number;
  volume24h: number;
  change24h: number;
}

const mockHashtags: TrendingHashtag[] = [
  { id: '1', tag: 'Web3', postCount: 12400, change: 45 },
  { id: '2', tag: 'DeFi', postCount: 8900, change: 32 },
  { id: '3', tag: 'NFTCommunity', postCount: 7650, change: 28 },
  { id: '4', tag: 'CryptoArt', postCount: 5200, change: 18 },
  { id: '5', tag: 'Metaverse', postCount: 4800, change: 15 },
];

const mockPosts: TrendingPost[] = [
  {
    id: '1',
    author: {
      username: 'cryptoartist',
      displayName: 'Crypto Artist',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
      isVerified: true,
    },
    content: 'Just dropped my biggest collection yet! 1000 unique generative art pieces exploring the future of digital identity. 🎨✨',
    media: [{ type: 'image', url: 'https://picsum.photos/seed/trending1/800/600' }],
    likes: 15600,
    comments: 1240,
    reposts: 3400,
    views: 142000,
  },
  {
    id: '2',
    author: {
      username: 'defiwhale',
      displayName: 'DeFi Whale',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=defiwhale',
      isVerified: true,
    },
    content: 'New protocol just launched with 200% APY on stablecoins. Here\'s my complete analysis and risk assessment 🧵',
    likes: 12300,
    comments: 890,
    reposts: 2100,
    views: 98000,
  },
];

const mockCommunities: TrendingCommunity[] = [
  {
    id: '1',
    name: 'Web3 Builders',
    description: 'Building the decentralized future together',
    avatar: 'https://api.dicebear.com/7.x/identicon/png?seed=web3builders',
    banner: 'https://picsum.photos/seed/web3/800/200',
    memberCount: 24500,
    growthRate: 156,
    isPrivate: false,
  },
  {
    id: '2',
    name: 'NFT Collectors Club',
    description: 'Premium NFT collectors and enthusiasts',
    avatar: 'https://api.dicebear.com/7.x/identicon/png?seed=nftclub',
    banner: 'https://picsum.photos/seed/nft/800/200',
    memberCount: 18200,
    growthRate: 98,
    isPrivate: false,
  },
];

const mockNFTs: TrendingNFT[] = [
  {
    id: '1',
    name: 'Cosmic Explorer #4521',
    collectionName: 'Cosmic Explorers',
    imageUrl: 'https://picsum.photos/seed/nft1/400/400',
    floorPrice: 2.5,
    volume24h: 145.8,
    change24h: 34,
  },
  {
    id: '2',
    name: 'Digital Dreams #892',
    collectionName: 'Digital Dreams',
    imageUrl: 'https://picsum.photos/seed/nft2/400/400',
    floorPrice: 1.8,
    volume24h: 98.4,
    change24h: 22,
  },
];

export default function TrendingPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<TrendingCategory>('all');

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const segments = [
    { id: 'all', label: 'All', icon: <TrendingUp size={16} /> },
    { id: 'hashtags', label: 'Hashtags', icon: <Hash size={16} /> },
    { id: 'posts', label: 'Posts', icon: <ImageIcon size={16} /> },
    { id: 'communities', label: 'Communities', icon: <Users size={16} /> },
    { id: 'nfts', label: 'NFTs', icon: <Video size={16} />, disabled: true },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={20} color={colors.text.primary} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Trending
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              What's happening now
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div style={{ padding: `0 ${spacing[4]} ${spacing[4]}`, overflowX: 'auto' }}>
          <SegmentedControl
            segments={segments}
            activeSegment={activeCategory}
            onChange={(id) => setActiveCategory(id as TrendingCategory)}
            size="sm"
          />
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Hashtags */}
        {(activeCategory === 'all' || activeCategory === 'hashtags') && (
          <div>
            {activeCategory === 'all' && (
              <h2
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  padding: spacing[4],
                  paddingBottom: spacing[2],
                  margin: 0,
                }}
              >
                Trending Hashtags
              </h2>
            )}
            {mockHashtags.map((hashtag, index) => (
              <div
                key={hashtag.id}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.default}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                  transition: 'background-color 150ms ease-out',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/hashtag/${hashtag.tag}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: colors.brand.primary + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.brand.primary,
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      marginBottom: spacing[1],
                    }}
                  >
                    #{hashtag.tag}
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                    {formatNumber(hashtag.postCount)} posts
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    padding: `${spacing[1]} ${spacing[2]}`,
                    backgroundColor: colors.semantic.success + '20',
                    borderRadius: '12px',
                  }}
                >
                  <TrendingUp size={14} color={colors.semantic.success} />
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.semantic.success,
                    }}
                  >
                    +{hashtag.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {(activeCategory === 'all' || activeCategory === 'posts') && (
          <div>
            {activeCategory === 'all' && (
              <h2
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  padding: spacing[4],
                  paddingBottom: spacing[2],
                  margin: 0,
                }}
              >
                Trending Posts
              </h2>
            )}
            {mockPosts.map((post) => (
              <div
                key={post.id}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.default}`,
                  transition: 'background-color 150ms ease-out',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/post/${post.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[3] }}>
                  <img
                    src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${post.author.username}`}
                    alt={post.author.displayName}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                      <span
                        style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.text.primary,
                        }}
                      >
                        {post.author.displayName}
                      </span>
                      {post.author.isVerified && (
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: `0 ${spacing[1]}`,
                            backgroundColor: colors.semantic.success,
                            borderRadius: '2px',
                            fontSize: typography.fontSize.xs,
                            color: 'white',
                            fontWeight: typography.fontWeight.bold,
                          }}
                        >
                          ✓
                        </span>
                      )}
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        @{post.author.username}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: typography.fontSize.base,
                        color: colors.text.primary,
                        margin: 0,
                        marginBottom: spacing[2],
                        lineHeight: typography.lineHeight.relaxed,
                      }}
                    >
                      {post.content}
                    </p>
                    {post.media && post.media.length > 0 && (
                      <div
                        style={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          marginBottom: spacing[3],
                        }}
                      >
                        <img
                          src={post.media[0].url}
                          alt="Post media"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                          }}
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatNumber(post.views)} views
                      </span>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatNumber(post.likes)} likes
                      </span>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatNumber(post.comments)} comments
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Communities */}
        {(activeCategory === 'all' || activeCategory === 'communities') && (
          <div>
            {activeCategory === 'all' && (
              <h2
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  padding: spacing[4],
                  paddingBottom: spacing[2],
                  margin: 0,
                }}
              >
                Trending Communities
              </h2>
            )}
            {mockCommunities.map((community) => (
              <div
                key={community.id}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.default}`,
                  transition: 'background-color 150ms ease-out',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/community/${community.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', gap: spacing[3] }}>
                  <img
                    src={community.avatar || `https://api.dicebear.com/7.x/identicon/png?seed=${community.id}`}
                    alt={community.name}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        marginBottom: spacing[1],
                      }}
                    >
                      {community.name}
                    </div>
                    <p
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                        margin: 0,
                        marginBottom: spacing[2],
                      }}
                    >
                      {community.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatNumber(community.memberCount)} members
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[1],
                        }}
                      >
                        <TrendingUp size={14} color={colors.semantic.success} />
                        <span
                          style={{
                            fontSize: typography.fontSize.xs,
                            fontWeight: typography.fontWeight.semibold,
                            color: colors.semantic.success,
                          }}
                        >
                          +{community.growthRate} this week
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NFTs - Coming Soon */}
        {activeCategory === 'nfts' && (
          <div
            style={{
              padding: spacing[8],
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[4],
              }}
            >
              <ImageIcon size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              Coming Soon
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              Trending NFTs will be available soon. Stay tuned for marketplace features!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
