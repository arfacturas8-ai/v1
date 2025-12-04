import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface Following {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  followerCount: number;
}

const mockFollowing: Following[] = [
  {
    id: '1',
    username: 'defiwhale',
    displayName: 'DeFi Whale',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=defiwhale',
    bio: 'Yield farming and DeFi strategies',
    isVerified: true,
    followerCount: 112000,
  },
  {
    id: '2',
    username: 'metaverse_dev',
    displayName: 'Metaverse Dev',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=metaverse',
    bio: 'Building virtual worlds',
    isVerified: false,
    followerCount: 67000,
  },
  {
    id: '3',
    username: 'cryptonews',
    displayName: 'Crypto News',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptonews',
    bio: 'Latest updates in crypto and blockchain',
    isVerified: true,
    followerCount: 234000,
  },
];

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [following, setFollowing] = useState<Following[]>(mockFollowing);

  const filteredFollowing = following.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnfollow = (userId: string) => {
    setFollowing((prev) => prev.filter((u) => u.id !== userId));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
              {username ? `@${username}'s following` : 'Following'}
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {following.length} following
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
              placeholder="Search following"
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

      {/* Following list */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {filteredFollowing.length > 0 ? (
          filteredFollowing.map((user) => (
            <div
              key={user.id}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                gap: spacing[3],
                transition: 'background-color 150ms ease-out',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/user/${user.username}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Avatar */}
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`}
                alt={user.displayName}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                  <span
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
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
                      marginBottom: spacing[1],
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
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                  {formatNumber(user.followerCount)} followers
                </div>
              </div>

              {/* Following button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnfollow(user.id);
                }}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: '24px',
                  border: `1px solid ${colors.border.default}`,
                  backgroundColor: 'transparent',
                  color: colors.text.primary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 150ms ease-out',
                  height: 'fit-content',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.semantic.error + '20';
                  e.currentTarget.style.borderColor = colors.semantic.error;
                  e.currentTarget.style.color = colors.semantic.error;
                  e.currentTarget.textContent = 'Unfollow';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = colors.border.default;
                  e.currentTarget.style.color = colors.text.primary;
                  e.currentTarget.textContent = 'Following';
                }}
              >
                Following
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
            <p style={{ fontSize: typography.fontSize.lg, color: colors.text.secondary }}>
              {searchQuery ? `No users found for "${searchQuery}"` : 'Not following anyone yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
