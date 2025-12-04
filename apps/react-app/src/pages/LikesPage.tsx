import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Search } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface LikeUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isFollowing: boolean;
  likedAt: string;
}

const mockLikeUsers: LikeUser[] = [
  {
    id: '1',
    username: 'sarah_design',
    displayName: 'Sarah Anderson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=sarah_design',
    bio: 'Product Designer @TechCo | Creating delightful experiences',
    isVerified: true,
    isFollowing: true,
    likedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    username: 'cryptowhale',
    displayName: 'Crypto Whale',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptowhale',
    bio: 'DeFi enthusiast | Building the future of finance',
    isVerified: false,
    isFollowing: false,
    likedAt: '2024-01-15T14:25:00Z',
  },
  {
    id: '3',
    username: 'alex_tech',
    displayName: 'Alex Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=alex_tech',
    bio: 'Full-stack developer | Open source contributor',
    isVerified: true,
    isFollowing: true,
    likedAt: '2024-01-15T14:20:00Z',
  },
  {
    id: '4',
    username: 'nft_collector',
    displayName: 'NFT Collector',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=nft_collector',
    bio: 'Collecting digital art | BAYC holder',
    isVerified: false,
    isFollowing: false,
    likedAt: '2024-01-15T14:15:00Z',
  },
  {
    id: '5',
    username: 'emily_writes',
    displayName: 'Emily Parker',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=emily_writes',
    bio: 'Writer & Content Creator | Tech & Culture',
    isVerified: true,
    isFollowing: false,
    likedAt: '2024-01-15T14:10:00Z',
  },
];

export default function LikesPage() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [likeUsers, setLikeUsers] = useState<LikeUser[]>(mockLikeUsers);

  const filteredUsers = likeUsers.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFollow = (userId: string) => {
    setLikeUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u))
    );
  };

  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
              Liked by
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {likeUsers.length} {likeUsers.length === 1 ? 'person' : 'people'}
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
              placeholder="Search people"
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

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                gap: spacing[3],
              }}
            >
              {/* Avatar */}
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

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                  <span
                    onClick={() => navigate(`/user/${user.username}`)}
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {user.bio}
                  </p>
                )}
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  Liked {formatTimestamp(user.likedAt)}
                </div>
              </div>

              {/* Follow button */}
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
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  if (user.isFollowing) {
                    e.currentTarget.style.backgroundColor = colors.semantic.error + '20';
                    e.currentTarget.style.borderColor = colors.semantic.error;
                    e.currentTarget.style.color = colors.semantic.error;
                    e.currentTarget.textContent = 'Unfollow';
                  } else {
                    e.currentTarget.style.backgroundColor = colors.brand.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (user.isFollowing) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = colors.border.default;
                    e.currentTarget.style.color = colors.text.primary;
                    e.currentTarget.textContent = 'Following';
                  } else {
                    e.currentTarget.style.backgroundColor = colors.brand.primary;
                  }
                }}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </button>
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
              <Heart size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              {searchQuery ? 'No people found' : 'No likes yet'}
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery
                ? `No users match "${searchQuery}"`
                : 'When people like this post, they\'ll show up here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
