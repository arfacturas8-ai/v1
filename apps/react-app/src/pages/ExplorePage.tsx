import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, Hash } from 'lucide-react';
import { colors, spacing, radii, shadows, typography } from '../design-system/tokens';
import { Text, Button, Input, Avatar } from '../design-system/atoms';
import { PostCard } from '../design-system/molecules';

interface TrendingTopic {
  tag: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

interface SuggestedUser {
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  followers: number;
  isVerified: boolean;
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
  createdAt: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  bookmarkCount: number;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
}

export function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'people' | 'topics'>('trending');
  const [trendingTopics] = useState<TrendingTopic[]>([
    { tag: 'Web3', count: 12453, trend: 'up' },
    { tag: 'NFTs', count: 8932, trend: 'up' },
    { tag: 'DeFi', count: 6721, trend: 'stable' },
    { tag: 'AI', count: 15234, trend: 'up' },
    { tag: 'CryptoArt', count: 4521, trend: 'down' },
  ]);

  const [suggestedUsers] = useState<SuggestedUser[]>([
    {
      username: 'vitalik',
      displayName: 'Vitalik Buterin',
      bio: 'Ethereum co-founder',
      followers: 2500000,
      isVerified: true,
    },
    {
      username: 'punk6529',
      displayName: 'punk6529',
      bio: 'NFT collector & Web3 advocate',
      followers: 450000,
      isVerified: true,
    },
    {
      username: 'defi_dad',
      displayName: 'DeFi Dad',
      bio: 'Teaching DeFi to the masses',
      followers: 320000,
      isVerified: false,
    },
  ]);

  const [trendingPosts] = useState<TrendingPost[]>([
    {
      id: '1',
      author: {
        username: 'cryptowhale',
        displayName: 'Crypto Whale',
        isVerified: true,
      },
      content: 'The future of social media is decentralized. CRYB is leading the way. 🚀',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likeCount: 1420,
      repostCount: 234,
      replyCount: 89,
      bookmarkCount: 156,
      isLiked: false,
      isReposted: false,
      isBookmarked: false,
    },
  ]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors['bg-primary'],
  };

  const maxWidthStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: spacing[4],
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    backgroundColor: colors['bg-primary'],
    borderBottom: `1px solid ${colors['border-default']}`,
    padding: spacing[4],
    marginBottom: spacing[4],
    zIndex: 10,
    backdropFilter: 'blur(10px)',
  };

  const searchBarStyle: React.CSSProperties = {
    position: 'relative',
    marginBottom: spacing[4],
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: spacing[3],
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors['text-tertiary'],
    pointerEvents: 'none',
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
    marginTop: spacing[3],
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    cursor: 'pointer',
    padding: `${spacing[2]} 0`,
    borderBottom: `2px solid ${isActive ? colors['brand-primary'] : 'transparent'}`,
    transition: 'all 150ms ease-out',
    flex: 1,
    textAlign: 'center',
  });

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: spacing[4],
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors['bg-secondary'],
    border: `1px solid ${colors['border-default']}`,
    borderRadius: radii.lg,
    padding: spacing[4],
    cursor: 'pointer',
    transition: 'all 150ms ease-out',
  };

  const cardHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: shadows.md,
    borderColor: colors['brand-primary'],
  };

  const userCardStyle: React.CSSProperties = {
    ...cardStyle,
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[3],
  };

  const topicCardStyle: React.CSSProperties = {
    ...cardStyle,
  };

  const trendBadgeStyle = (trend: 'up' | 'down' | 'stable'): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[1],
    padding: `${spacing[1]} ${spacing[2]}`,
    backgroundColor:
      trend === 'up' ? colors['success-bg'] :
      trend === 'down' ? colors['error-bg'] :
      colors['bg-elevated'],
    color:
      trend === 'up' ? colors['success'] :
      trend === 'down' ? colors['error'] :
      colors['text-secondary'],
    borderRadius: radii.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  });

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={maxWidthStyle}>
        <div style={headerStyle}>
          <Text size="xl" weight="bold">
            Explore
          </Text>

          <form onSubmit={handleSearch} style={searchBarStyle}>
            <div style={searchIconStyle}>
              <Search size={20} />
            </div>
            <Input
              type="text"
              placeholder="Search CRYB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
          </form>

          <div style={tabsStyle}>
            <div
              style={tabStyle(activeTab === 'trending')}
              onClick={() => setActiveTab('trending')}
            >
              <Text weight={activeTab === 'trending' ? 'semibold' : 'regular'}>
                Trending
              </Text>
            </div>
            <div
              style={tabStyle(activeTab === 'people')}
              onClick={() => setActiveTab('people')}
            >
              <Text weight={activeTab === 'people' ? 'semibold' : 'regular'}>
                People
              </Text>
            </div>
            <div
              style={tabStyle(activeTab === 'topics')}
              onClick={() => setActiveTab('topics')}
            >
              <Text weight={activeTab === 'topics' ? 'semibold' : 'regular'}>
                Topics
              </Text>
            </div>
          </div>
        </div>

        {activeTab === 'trending' && (
          <div>
            <div style={{ marginBottom: spacing[6] }}>
              <Text size="lg" weight="semibold" style={{ marginBottom: spacing[3] }}>
                Trending Posts
              </Text>
              {trendingPosts.map((post) => (
                <div key={post.id} style={{ marginBottom: spacing[3] }}>
                  <PostCard
                    post={post}
                    onPostClick={() => navigate(`/post/${post.id}`)}
                    onUserClick={() => navigate(`/profile/${post.author.username}`)}
                    onReplyClick={() => navigate(`/post/${post.id}#reply`)}
                  />
                </div>
              ))}
            </div>

            <div>
              <Text size="lg" weight="semibold" style={{ marginBottom: spacing[3] }}>
                Trending Topics
              </Text>
              <div style={gridStyle}>
                {trendingTopics.map((topic) => (
                  <div
                    key={topic.tag}
                    style={{
                      ...topicCardStyle,
                      ...(hoveredCard === topic.tag ? cardHoverStyle : {}),
                    }}
                    onMouseEnter={() => setHoveredCard(topic.tag)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => navigate(`/search?q=${encodeURIComponent('#' + topic.tag)}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
                      <Hash size={20} color={colors['brand-primary']} />
                      <Text size="lg" weight="semibold">
                        {topic.tag}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="secondary" size="sm">
                        {formatNumber(topic.count)} posts
                      </Text>
                      <div style={trendBadgeStyle(topic.trend)}>
                        <TrendingUp size={12} />
                        {topic.trend === 'up' ? 'Trending' : topic.trend === 'down' ? 'Declining' : 'Stable'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div>
            <Text size="lg" weight="semibold" style={{ marginBottom: spacing[3] }}>
              Suggested People
            </Text>
            <div style={gridStyle}>
              {suggestedUsers.map((user) => (
                <div
                  key={user.username}
                  style={{
                    ...userCardStyle,
                    ...(hoveredCard === user.username ? cardHoverStyle : {}),
                  }}
                  onMouseEnter={() => setHoveredCard(user.username)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <Avatar
                    src={user.avatar}
                    alt={user.displayName}
                    size="lg"
                    onClick={() => navigate(`/profile/${user.username}`)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], marginBottom: spacing[1] }}>
                      <Text weight="semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.displayName}
                      </Text>
                      {user.isVerified && (
                        <span style={{ color: colors['brand-primary'], fontSize: '16px' }}>✓</span>
                      )}
                    </div>
                    <Text variant="secondary" size="sm" style={{ marginBottom: spacing[2] }}>
                      @{user.username}
                    </Text>
                    {user.bio && (
                      <Text size="sm" style={{ marginBottom: spacing[2] }}>
                        {user.bio}
                      </Text>
                    )}
                    <Text variant="secondary" size="xs">
                      {formatNumber(user.followers)} followers
                    </Text>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${user.username}`);
                      }}
                      style={{ marginTop: spacing[2], width: '100%' }}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div>
            <Text size="lg" weight="semibold" style={{ marginBottom: spacing[3] }}>
              Popular Topics
            </Text>
            <div style={gridStyle}>
              {trendingTopics.map((topic) => (
                <div
                  key={topic.tag}
                  style={{
                    ...topicCardStyle,
                    ...(hoveredCard === `topic-${topic.tag}` ? cardHoverStyle : {}),
                  }}
                  onMouseEnter={() => setHoveredCard(`topic-${topic.tag}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => navigate(`/search?q=${encodeURIComponent('#' + topic.tag)}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
                    <Hash size={24} color={colors['brand-primary']} />
                    <Text size="xl" weight="bold">
                      {topic.tag}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="secondary" size="base">
                      {formatNumber(topic.count)} posts
                    </Text>
                    <div style={trendBadgeStyle(topic.trend)}>
                      <TrendingUp size={14} />
                      {topic.trend === 'up' ? 'Trending' : topic.trend === 'down' ? 'Declining' : 'Stable'}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/search?q=${encodeURIComponent('#' + topic.tag)}`);
                    }}
                    style={{ marginTop: spacing[3], width: '100%' }}
                  >
                    Explore #{topic.tag}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExplorePage;
