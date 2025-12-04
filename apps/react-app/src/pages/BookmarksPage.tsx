import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Bookmark, X } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface BookmarkedPost {
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
  timestamp: string;
  likes: number;
  comments: number;
  reposts: number;
  bookmarkedAt: string;
}

const mockBookmarks: BookmarkedPost[] = [
  {
    id: '1',
    author: {
      username: 'cryptoartist',
      displayName: 'Crypto Artist',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
      isVerified: true,
    },
    content: 'Just minted my latest collection! Check out these generative art pieces exploring the intersection of AI and blockchain. 🎨✨',
    media: [
      {
        type: 'image',
        url: 'https://picsum.photos/seed/art1/800/600',
      },
    ],
    timestamp: '2024-01-15T10:30:00Z',
    likes: 1240,
    comments: 87,
    reposts: 156,
    bookmarkedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: '2',
    author: {
      username: 'defiwhale',
      displayName: 'DeFi Whale',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=defiwhale',
      isVerified: true,
    },
    content: 'New yield farming strategy for the community. Here\'s how I\'m getting 15% APY on stable coins with minimal risk. Thread 🧵',
    timestamp: '2024-01-14T15:20:00Z',
    likes: 2130,
    comments: 234,
    reposts: 421,
    bookmarkedAt: '2024-01-14T16:45:00Z',
  },
  {
    id: '3',
    author: {
      username: 'web3builder',
      displayName: 'Web3 Builder',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=web3builder',
      isVerified: true,
    },
    content: 'Building in public: Day 30 of our decentralized social protocol. Here are the key learnings and metrics so far.',
    timestamp: '2024-01-13T09:15:00Z',
    likes: 890,
    comments: 45,
    reposts: 112,
    bookmarkedAt: '2024-01-13T11:30:00Z',
  },
];

export default function BookmarksPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>(mockBookmarks);

  const filteredBookmarks = bookmarks.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveBookmark = (postId: string) => {
    setBookmarks((prev) => prev.filter((p) => p.id !== postId));
  };

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
              Bookmarks
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {bookmarks.length} saved {bookmarks.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: `0 ${spacing[4]} ${spacing[4]}` }}>
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
              placeholder="Search bookmarks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        </div>
      </header>

      {/* Bookmarks list */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {filteredBookmarks.length > 0 ? (
          filteredBookmarks.map((post) => (
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
              {/* Post header */}
              <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[3] }}>
                {/* Avatar */}
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

                {/* Author info and content */}
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

                  {/* Content */}
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

                  {/* Media */}
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

                  {/* Stats */}
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

                {/* Remove bookmark button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBookmark(post.id);
                  }}
                  aria-label="Remove bookmark"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 150ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.semantic.error + '20';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Bookmark size={20} fill={colors.brand.primary} color={colors.brand.primary} />
                </button>
              </div>
            </div>
          ))
        ) : (
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
              <Bookmark size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? `No bookmarks match "${searchQuery}"`
                : 'Bookmark posts to save them for later. Your bookmarks will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
