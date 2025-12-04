import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, User, Users, Hash, FileText } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';
import { TabBar } from '../design-system/molecules/TabBar';

type SearchCategory = 'all' | 'people' | 'communities' | 'hashtags' | 'posts';

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  followerCount: number;
  isFollowing: boolean;
}

interface SearchCommunity {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  memberCount: number;
  isPrivate: boolean;
  isMember: boolean;
}

interface SearchHashtag {
  id: string;
  tag: string;
  postCount: number;
  description: string;
}

interface SearchPost {
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
  timestamp: string;
}

const mockUsers: SearchUser[] = [
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
];

const mockCommunities: SearchCommunity[] = [
  {
    id: '1',
    name: 'Web3 Builders',
    description: 'Building the decentralized future together',
    avatar: 'https://api.dicebear.com/7.x/identicon/png?seed=web3builders',
    memberCount: 24500,
    isPrivate: false,
    isMember: false,
  },
  {
    id: '2',
    name: 'NFT Collectors Club',
    description: 'Premium NFT collectors and enthusiasts',
    avatar: 'https://api.dicebear.com/7.x/identicon/png?seed=nftclub',
    memberCount: 18200,
    isPrivate: false,
    isMember: false,
  },
];

const mockHashtags: SearchHashtag[] = [
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
];

const mockPosts: SearchPost[] = [
  {
    id: '1',
    author: {
      username: 'cryptoartist',
      displayName: 'Crypto Artist',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
      isVerified: true,
    },
    content: 'Just dropped my biggest collection yet! 1000 unique generative art pieces exploring the future of digital identity. 🎨✨',
    media: [{ type: 'image', url: 'https://picsum.photos/seed/search1/800/600' }],
    likes: 15600,
    comments: 1240,
    timestamp: '2024-01-15T10:30:00Z',
  },
];

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [users, setUsers] = useState<SearchUser[]>(mockUsers);
  const [communities, setCommunities] = useState<SearchCommunity[]>(mockCommunities);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
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
    { id: 'all', label: 'All', icon: <Search size={16} /> },
    { id: 'people', label: 'People', icon: <User size={16} /> },
    { id: 'communities', label: 'Communities', icon: <Users size={16} /> },
    { id: 'hashtags', label: 'Hashtags', icon: <Hash size={16} /> },
    { id: 'posts', label: 'Posts', icon: <FileText size={16} /> },
  ];

  const hasResults = users.length > 0 || communities.length > 0 || mockHashtags.length > 0 || mockPosts.length > 0;

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

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1 }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
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
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} ${spacing[10]}`,
                  backgroundColor: colors.bg.secondary,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '24px',
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.default;
                }}
              />
            </div>
          </form>
        </div>

        {/* Tabs */}
        {query && (
          <div style={{ padding: `0 ${spacing[4]} ${spacing[2]}`, overflowX: 'auto' }}>
            <TabBar
              tabs={tabs}
              activeTab={activeCategory}
              onChange={(id) => setActiveCategory(id as SearchCategory)}
              variant="underline"
            />
          </div>
        )}
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {!query ? (
          // Empty state - no search query
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
              <Search size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              Search CRYB.AI
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              Find people, communities, hashtags, and posts
            </p>
          </div>
        ) : !hasResults ? (
          // No results found
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
              <Search size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No results found
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              Try searching for something else or check your spelling
            </p>
          </div>
        ) : (
          <>
            {/* People */}
            {(activeCategory === 'all' || activeCategory === 'people') && users.length > 0 && (
              <div>
                {activeCategory === 'all' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing[4],
                      paddingBottom: spacing[2],
                    }}
                  >
                    <h2
                      style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        margin: 0,
                      }}
                    >
                      People
                    </h2>
                    <button
                      onClick={() => setActiveCategory('people')}
                      style={{
                        padding: `${spacing[1]} ${spacing[3]}`,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: colors.brand.primary,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: 'pointer',
                      }}
                    >
                      View all
                    </button>
                  </div>
                )}
                {users.slice(0, activeCategory === 'all' ? 3 : undefined).map((user) => (
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
                        width: '48px',
                        height: '48px',
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

            {/* Communities */}
            {(activeCategory === 'all' || activeCategory === 'communities') && communities.length > 0 && (
              <div>
                {activeCategory === 'all' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing[4],
                      paddingBottom: spacing[2],
                      paddingTop: activeCategory === 'all' && users.length > 0 ? spacing[6] : spacing[4],
                    }}
                  >
                    <h2
                      style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        margin: 0,
                      }}
                    >
                      Communities
                    </h2>
                    <button
                      onClick={() => setActiveCategory('communities')}
                      style={{
                        padding: `${spacing[1]} ${spacing[3]}`,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: colors.brand.primary,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: 'pointer',
                      }}
                    >
                      View all
                    </button>
                  </div>
                )}
                {communities.slice(0, activeCategory === 'all' ? 2 : undefined).map((community) => (
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
                        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                          {formatNumber(community.memberCount)} members
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hashtags */}
            {(activeCategory === 'all' || activeCategory === 'hashtags') && mockHashtags.length > 0 && (
              <div>
                {activeCategory === 'all' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing[4],
                      paddingBottom: spacing[2],
                      paddingTop: spacing[6],
                    }}
                  >
                    <h2
                      style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        margin: 0,
                      }}
                    >
                      Hashtags
                    </h2>
                    <button
                      onClick={() => setActiveCategory('hashtags')}
                      style={{
                        padding: `${spacing[1]} ${spacing[3]}`,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: colors.brand.primary,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: 'pointer',
                      }}
                    >
                      View all
                    </button>
                  </div>
                )}
                {mockHashtags.slice(0, activeCategory === 'all' ? 3 : undefined).map((hashtag) => (
                  <div
                    key={hashtag.id}
                    onClick={() => navigate(`/hashtag/${hashtag.tag}`)}
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
                        {hashtag.tag}
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
                      {hashtag.description}
                    </p>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {formatNumber(hashtag.postCount)} posts
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Posts */}
            {(activeCategory === 'all' || activeCategory === 'posts') && mockPosts.length > 0 && (
              <div>
                {activeCategory === 'all' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: spacing[4],
                      paddingBottom: spacing[2],
                      paddingTop: spacing[6],
                    }}
                  >
                    <h2
                      style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.text.primary,
                        margin: 0,
                      }}
                    >
                      Posts
                    </h2>
                    <button
                      onClick={() => setActiveCategory('posts')}
                      style={{
                        padding: `${spacing[1]} ${spacing[3]}`,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: colors.brand.primary,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: 'pointer',
                      }}
                    >
                      View all
                    </button>
                  </div>
                )}
                {mockPosts.slice(0, activeCategory === 'all' ? 2 : undefined).map((post) => (
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
