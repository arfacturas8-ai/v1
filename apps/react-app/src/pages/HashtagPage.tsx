import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';
import { TabBar } from '../design-system/molecules/TabBar';

type HashtagTab = 'top' | 'latest' | 'people';

interface HashtagPost {
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
  timestamp: string;
}

interface HashtagUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  followerCount: number;
  postCount: number;
  isFollowing: boolean;
}

const mockPosts: HashtagPost[] = [
  {
    id: '1',
    author: {
      username: 'cryptoartist',
      displayName: 'Crypto Artist',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
      isVerified: true,
    },
    content: 'Just dropped my biggest collection yet! 1000 unique generative art pieces exploring the future of digital identity. #Web3 #NFT 🎨✨',
    media: [{ type: 'image', url: 'https://picsum.photos/seed/hashtag1/800/600' }],
    likes: 15600,
    comments: 1240,
    reposts: 3400,
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    author: {
      username: 'defiwhale',
      displayName: 'DeFi Whale',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=defiwhale',
      isVerified: true,
    },
    content: 'New protocol just launched with 200% APY on stablecoins. Here\'s my complete analysis and risk assessment #Web3 #DeFi 🧵',
    likes: 12300,
    comments: 890,
    reposts: 2100,
    timestamp: '2024-01-15T08:15:00Z',
  },
  {
    id: '3',
    author: {
      username: 'web3builder',
      displayName: 'Web3 Builder',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=web3builder',
      isVerified: true,
    },
    content: 'Building in public: Day 30 of our decentralized social protocol. Here are the key learnings and metrics so far. #Web3 #BuildInPublic',
    likes: 8900,
    comments: 456,
    reposts: 1200,
    timestamp: '2024-01-14T16:45:00Z',
  },
  {
    id: '4',
    author: {
      username: 'nftcollector',
      displayName: 'NFT Collector',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=nftcollector',
      isVerified: false,
    },
    content: 'Alpha leak: Found an amazing new collection that\'s still under the radar. Floor is 0.1 ETH but not for long. #Web3 #NFT',
    likes: 5600,
    comments: 234,
    reposts: 890,
    timestamp: '2024-01-14T12:20:00Z',
  },
];

const mockUsers: HashtagUser[] = [
  {
    id: '1',
    username: 'cryptoartist',
    displayName: 'Crypto Artist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
    bio: 'Digital artist creating NFT collections',
    isVerified: true,
    followerCount: 125000,
    postCount: 1240,
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
    postCount: 890,
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
    postCount: 567,
    isFollowing: true,
  },
];

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HashtagTab>('top');
  const [users, setUsers] = useState<HashtagUser[]>(mockUsers);
  const [isFollowing, setIsFollowing] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleFollowUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u))
    );
  };

  const tabs = [
    { id: 'top', label: 'Top', icon: <Sparkles size={16} /> },
    { id: 'latest', label: 'Latest', icon: <Clock size={16} /> },
    { id: 'people', label: 'People', icon: <TrendingUp size={16} /> },
  ];

  // Sort posts based on active tab
  const sortedPosts = [...mockPosts].sort((a, b) => {
    if (activeTab === 'latest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    // Top: sort by engagement (likes + comments + reposts)
    const engagementA = a.likes + a.comments + a.reposts;
    const engagementB = b.likes + b.comments + b.reposts;
    return engagementB - engagementA;
  });

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
              flexShrink: 0,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
              <Hash size={24} color={colors.brand.primary} />
              <h1
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                {tag}
              </h1>
            </div>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {formatNumber(mockPosts.length * 3100)} posts
            </p>
          </div>

          <button
            onClick={() => setIsFollowing(!isFollowing)}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: isFollowing ? `1px solid ${colors.border.default}` : 'none',
              backgroundColor: isFollowing ? 'transparent' : colors.brand.primary,
              color: isFollowing ? colors.text.primary : 'white',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ padding: `0 ${spacing[4]} ${spacing[2]}`, overflowX: 'auto' }}>
          <TabBar tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as HashtagTab)} variant="underline" />
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Top Posts Tab */}
        {(activeTab === 'top' || activeTab === 'latest') && (
          <div>
            {sortedPosts.map((post) => (
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
                <div style={{ display: 'flex', gap: spacing[3] }}>
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
                      <span style={{ color: colors.text.tertiary }}>·</span>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatTimestamp(post.timestamp)}
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
                        {formatNumber(post.likes)} likes
                      </span>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatNumber(post.comments)} comments
                      </span>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                        {formatNumber(post.reposts)} reposts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* People Tab */}
        {activeTab === 'people' && (
          <div>
            <div style={{ padding: spacing[4], paddingBottom: spacing[2] }}>
              <h2
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                Top Contributors
              </h2>
            </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {formatNumber(user.followerCount)} followers
                    </span>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {formatNumber(user.postCount)} posts with #{tag}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleFollowUser(user.id)}
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
