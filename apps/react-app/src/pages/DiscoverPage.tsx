import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, Sparkles, Hash, Globe } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';
import { TabBar } from '../design-system/molecules/TabBar';

type DiscoverTab = 'for-you' | 'trending' | 'communities' | 'creators';

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  followerCount: number;
  isFollowing: boolean;
}

interface TrendingTopic {
  id: string;
  tag: string;
  postCount: number;
  description: string;
}

interface FeaturedCommunity {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  memberCount: number;
  category: string;
  isPrivate: boolean;
  isMember: boolean;
}

const mockUsers: SuggestedUser[] = [
  {
    id: '1',
    username: 'cryptoartist',
    displayName: 'Crypto Artist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
    bio: 'Digital artist creating NFT collections',
    isVerified: true,
    followerCount: 125000,
    isFollowing: false,
  },
  {
    id: '2',
    username: 'defiwhale',
    displayName: 'DeFi Whale',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=defiwhale',
    bio: 'Yield farming and DeFi strategies',
    isVerified: true,
    followerCount: 112000,
    isFollowing: false,
  },
  {
    id: '3',
    username: 'web3builder',
    displayName: 'Web3 Builder',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=web3builder',
    bio: 'Building the decentralized future',
    isVerified: true,
    followerCount: 89000,
    isFollowing: true,
  },
];

const mockTopics: TrendingTopic[] = [
  {
    id: '1',
    tag: 'Web3',
    postCount: 12400,
    description: 'Latest in Web3 technology and decentralization',
  },
  {
    id: '2',
    tag: 'DeFi',
    postCount: 8900,
    description: 'Decentralized Finance news and strategies',
  },
  {
    id: '3',
    tag: 'NFTCommunity',
    postCount: 7650,
    description: 'NFT collectors and creators unite',
  },
  {
    id: '4',
    tag: 'CryptoArt',
    postCount: 5200,
    description: 'Digital art and generative creations',
  },
];

const mockCommunities: FeaturedCommunity[] = [
  {
    id: '1',
    name: 'Web3 Builders',
    description: 'Building the decentralized future together',
    avatar: 'https://api.dicebear.com/7.x/identicon/png?seed=web3builders',
    banner: 'https://picsum.photos/seed/web3/800/200',
    memberCount: 24500,
    category: 'Technology',
    isPrivate: false,
    isMember: false,
  },
  {
    id: '2',
    name: 'NFT Collectors Club',
    description: 'Premium NFT collectors and enthusiasts',
    avatar: 'https://api.dicebear.com/7.x/identicon/png?seed=nftclub',
    banner: 'https://picsum.photos/seed/nft/800/200',
    memberCount: 18200,
    category: 'Art & Collectibles',
    isPrivate: false,
    isMember: false,
  },
  {
    id: '3',
    name: 'DeFi Strategies',
    description: 'Advanced DeFi strategies and discussions',
    avatar: 'https://api.dicebear.com/7.x/identicon/png?seed=defi',
    banner: 'https://picsum.photos/seed/defi/800/200',
    memberCount: 15600,
    category: 'Finance',
    isPrivate: false,
    isMember: true,
  },
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DiscoverTab>('for-you');
  const [users, setUsers] = useState<SuggestedUser[]>(mockUsers);
  const [communities, setCommunities] = useState<FeaturedCommunity[]>(mockCommunities);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleFollow = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u))
    );
  };

  const handleJoinCommunity = (communityId: string) => {
    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, isMember: !c.isMember } : c))
    );
  };

  const tabs = [
    { id: 'for-you', label: 'For You', icon: <Sparkles size={16} /> },
    { id: 'trending', label: 'Trending', icon: <TrendingUp size={16} /> },
    { id: 'communities', label: 'Communities', icon: <Users size={16} /> },
    { id: 'creators', label: 'Creators', icon: <Globe size={16} /> },
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
        <div style={{ padding: spacing[4] }}>
          <h1
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0,
              marginBottom: spacing[4],
            }}
          >
            Discover
          </h1>

          {/* Search bar */}
          <div
            onClick={() => navigate('/search')}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <Search
              size={20}
              color={colors.text.tertiary}
              style={{
                position: 'absolute',
                left: spacing[3],
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                width: '100%',
                padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} ${spacing[10]}`,
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '24px',
                color: colors.text.tertiary,
                fontSize: typography.fontSize.base,
              }}
            >
              Search for people, communities, and topics
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: `0 ${spacing[4]} ${spacing[2]}`, overflowX: 'auto' }}>
          <TabBar tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as DiscoverTab)} variant="underline" />
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* For You Tab */}
        {activeTab === 'for-you' && (
          <div>
            {/* Suggested Users */}
            <div style={{ padding: spacing[4], paddingBottom: spacing[2] }}>
              <h2
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                Suggested Creators
              </h2>
            </div>
            {users.slice(0, 3).map((user) => (
              <div
                key={user.id}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.default}`,
                  display: 'flex',
                  gap: spacing[3],
                }}
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`}
                  alt={user.displayName}
                  onClick={() => navigate(`/user/${user.username}`)}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                    <span
                      onClick={() => navigate(`/user/${user.username}`)}
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary,
                        cursor: 'pointer',
                      }}
                    >
                      {user.displayName}
                    </span>
                    {user.isVerified && (
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
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                    @{user.username}
                  </div>
                  {user.bio && (
                    <p
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                        margin: 0,
                        marginBottom: spacing[2],
                      }}
                    >
                      {user.bio}
                    </p>
                  )}
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                    {formatNumber(user.followerCount)} followers
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(user.id)}
                  style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: '24px',
                    border: user.isFollowing ? `1px solid ${colors.border.default}` : 'none',
                    backgroundColor: user.isFollowing ? 'transparent' : colors.brand.primary,
                    color: user.isFollowing ? colors.text.primary : 'white',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: 'pointer',
                    flexShrink: 0,
                    height: 'fit-content',
                  }}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}

            {/* Trending Topics */}
            <div style={{ padding: spacing[4], paddingBottom: spacing[2], paddingTop: spacing[6] }}>
              <h2
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                Trending Topics
              </h2>
            </div>
            {mockTopics.slice(0, 4).map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/hashtag/${topic.tag}`)}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.default}`,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                  <Hash size={16} color={colors.text.tertiary} />
                  <span
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                    }}
                  >
                    {topic.tag}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    margin: 0,
                    marginBottom: spacing[1],
                  }}
                >
                  {topic.description}
                </p>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                  {formatNumber(topic.postCount)} posts
                </div>
              </div>
            ))}

            {/* Featured Communities */}
            <div style={{ padding: spacing[4], paddingBottom: spacing[2], paddingTop: spacing[6] }}>
              <h2
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                Featured Communities
              </h2>
            </div>
            {communities.slice(0, 2).map((community) => (
              <div
                key={community.id}
                onClick={() => navigate(`/community/${community.id}`)}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.default}`,
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
                <div style={{ display: 'flex', gap: spacing[3] }}>
                  <img
                    src={community.avatar}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                      <span
                        style={{
                          fontSize: typography.fontSize.xs,
                          color: colors.text.tertiary,
                          padding: `${spacing[1]} ${spacing[2]}`,
                          backgroundColor: colors.bg.secondary,
                          borderRadius: '4px',
                        }}
                      >
                        {community.category}
                      </span>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatNumber(community.memberCount)} members
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div>
            {mockTopics.map((topic, index) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/hashtag/${topic.tag}`)}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.default}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
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
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                      marginBottom: spacing[1],
                    }}
                  >
                    #{topic.tag}
                  </div>
                  <p
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      margin: 0,
                      marginBottom: spacing[1],
                    }}
                  >
                    {topic.description}
                  </p>
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                    {formatNumber(topic.postCount)} posts
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <div>
            {communities.map((community) => (
              <div
                key={community.id}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.default}`,
                }}
              >
                {/* Banner */}
                {community.banner && (
                  <div
                    style={{
                      width: '100%',
                      height: '120px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: spacing[3],
                    }}
                  >
                    <img
                      src={community.banner}
                      alt={community.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: spacing[3] }}>
                  <img
                    src={community.avatar}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
                      <span
                        style={{
                          fontSize: typography.fontSize.xs,
                          color: colors.text.tertiary,
                          padding: `${spacing[1]} ${spacing[2]}`,
                          backgroundColor: colors.bg.secondary,
                          borderRadius: '4px',
                        }}
                      >
                        {community.category}
                      </span>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatNumber(community.memberCount)} members
                      </span>
                    </div>
                    <button
                      onClick={() => handleJoinCommunity(community.id)}
                      style={{
                        padding: `${spacing[2]} ${spacing[4]}`,
                        borderRadius: '24px',
                        border: community.isMember ? `1px solid ${colors.border.default}` : 'none',
                        backgroundColor: community.isMember ? 'transparent' : colors.brand.primary,
                        color: community.isMember ? colors.text.primary : 'white',
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: 'pointer',
                      }}
                    >
                      {community.isMember ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Creators Tab */}
        {activeTab === 'creators' && (
          <div>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: spacing[4],
                  borderBottom: `1px solid ${colors.border.default}`,
                  display: 'flex',
                  gap: spacing[3],
                }}
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`}
                  alt={user.displayName}
                  onClick={() => navigate(`/user/${user.username}`)}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                    <span
                      onClick={() => navigate(`/user/${user.username}`)}
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary,
                        cursor: 'pointer',
                      }}
                    >
                      {user.displayName}
                    </span>
                    {user.isVerified && (
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
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                    @{user.username}
                  </div>
                  {user.bio && (
                    <p
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                        margin: 0,
                        marginBottom: spacing[2],
                      }}
                    >
                      {user.bio}
                    </p>
                  )}
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                    {formatNumber(user.followerCount)} followers
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(user.id)}
                  style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: '24px',
                    border: user.isFollowing ? `1px solid ${colors.border.default}` : 'none',
                    backgroundColor: user.isFollowing ? 'transparent' : colors.brand.primary,
                    color: user.isFollowing ? colors.text.primary : 'white',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: 'pointer',
                    flexShrink: 0,
                    height: 'fit-content',
                  }}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
