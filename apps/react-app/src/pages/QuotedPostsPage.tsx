import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Repeat2, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface QuotedPost {
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

interface OriginalPost {
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
}

const mockOriginalPost: OriginalPost = {
  id: 'original',
  author: {
    username: 'vitalik',
    displayName: 'Vitalik Buterin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=vitalik',
    isVerified: true,
  },
  content: 'Excited to announce our latest upgrade to Ethereum 2.0. This will significantly improve scalability and reduce gas fees.',
  media: [
    {
      type: 'image',
      url: 'https://picsum.photos/seed/eth/800/400',
    },
  ],
  timestamp: '2024-01-15T10:00:00Z',
};

const mockQuotedPosts: QuotedPost[] = [
  {
    id: '1',
    author: {
      username: 'cryptoanalyst',
      displayName: 'Crypto Analyst',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoanalyst',
      isVerified: true,
    },
    content: 'This is huge for the entire DeFi ecosystem! The gas fee reduction alone will make Ethereum viable for everyday transactions again. 🚀',
    likes: 4523,
    comments: 234,
    reposts: 891,
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
    content: 'Finally! Been waiting for this upgrade for months. Time to move more assets back to mainnet.',
    likes: 3211,
    comments: 156,
    reposts: 567,
    timestamp: '2024-01-15T11:15:00Z',
  },
  {
    id: '3',
    author: {
      username: 'web3builder',
      displayName: 'Web3 Builder',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=web3builder',
      isVerified: true,
    },
    content: 'As a developer, I\'m most excited about the scalability improvements. This opens up so many new possibilities for dApps.',
    likes: 2876,
    comments: 98,
    reposts: 445,
    timestamp: '2024-01-15T12:00:00Z',
  },
  {
    id: '4',
    author: {
      username: 'nftcollector',
      displayName: 'NFT Collector',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=nftcollector',
      isVerified: false,
    },
    content: 'Lower gas fees mean more people can afford to mint and trade NFTs. This is great for the entire creator economy!',
    likes: 1456,
    comments: 67,
    reposts: 234,
    timestamp: '2024-01-15T13:45:00Z',
  },
];

export default function QuotedPostsPage() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [quotedPosts, setQuotedPosts] = useState<QuotedPost[]>(mockQuotedPosts);

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
              Quoted Posts
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {formatNumber(quotedPosts.length)} {quotedPosts.length === 1 ? 'quote' : 'quotes'}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Original post */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.bg.secondary,
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <div style={{ marginBottom: spacing[2] }}>
            <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, fontWeight: typography.fontWeight.semibold }}>
              Original post
            </span>
          </div>

          <div style={{ display: 'flex', gap: spacing[3] }}>
            <img
              src={mockOriginalPost.author.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${mockOriginalPost.author.username}`}
              alt={mockOriginalPost.author.displayName}
              onClick={() => navigate(`/user/${mockOriginalPost.author.username}`)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                <span
                  onClick={() => navigate(`/user/${mockOriginalPost.author.username}`)}
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    cursor: 'pointer',
                  }}
                >
                  {mockOriginalPost.author.displayName}
                </span>
                {mockOriginalPost.author.isVerified && (
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
                  @{mockOriginalPost.author.username}
                </span>
                <span style={{ color: colors.text.tertiary }}>·</span>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                  {formatTimestamp(mockOriginalPost.timestamp)}
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
                {mockOriginalPost.content}
              </p>

              {mockOriginalPost.media && mockOriginalPost.media.length > 0 && (
                <div
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={mockOriginalPost.media[0].url}
                    alt="Post media"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quoted posts */}
        {quotedPosts.map((post) => (
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
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
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

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    aria-label="More options"
                    style={{
                      width: '32px',
                      height: '32px',
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
                    <MoreHorizontal size={16} color={colors.text.tertiary} />
                  </button>
                </div>

                <p
                  style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.primary,
                    margin: 0,
                    marginBottom: spacing[3],
                    lineHeight: typography.lineHeight.relaxed,
                  }}
                >
                  {post.content}
                </p>

                {/* Embedded original post preview */}
                <div
                  style={{
                    padding: spacing[3],
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: '12px',
                    marginBottom: spacing[3],
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
                    <img
                      src={mockOriginalPost.author.avatar}
                      alt={mockOriginalPost.author.displayName}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                    <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                      {mockOriginalPost.author.displayName}
                    </span>
                    {mockOriginalPost.author.isVerified && (
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
                    <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                      @{mockOriginalPost.author.username}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {mockOriginalPost.content}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[6] }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <MessageCircle size={18} color={colors.text.tertiary} />
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {formatNumber(post.comments)}
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <Repeat2 size={18} color={colors.text.tertiary} />
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {formatNumber(post.reposts)}
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <Heart size={18} color={colors.text.tertiary} />
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {formatNumber(post.likes)}
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <Share2 size={18} color={colors.text.tertiary} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
