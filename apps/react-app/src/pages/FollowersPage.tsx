import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface Follower {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isFollowing: boolean;
  followerCount: number;
}

const mockFollowers: Follower[] = [
  {
    id: '1',
    username: 'cryptoartist',
    displayName: 'Crypto Artist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
    bio: 'Digital artist creating NFT collections',
    isVerified: true,
    isFollowing: true,
    followerCount: 125000,
  },
  {
    id: '2',
    username: 'web3builder',
    displayName: 'Web3 Builder',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=web3builder',
    bio: 'Building the decentralized future',
    isVerified: true,
    isFollowing: false,
    followerCount: 89000,
  },
  {
    id: '3',
    username: 'nftcollector',
    displayName: 'NFT Collector',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=nftcollector',
    bio: 'Collecting rare digital assets',
    isVerified: false,
    isFollowing: true,
    followerCount: 56000,
  },
];

export default function FollowersPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<Follower[]>(mockFollowers);

  const filteredFollowers = followers.filter(
    (follower) =>
      follower.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      follower.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFollow = (followerId: string) => {
    setFollowers((prev) =>
      prev.map((f) => (f.id === followerId ? { ...f, isFollowing: !f.isFollowing } : f))
    );
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
              {username ? `@${username}'s followers` : 'Followers'}
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
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
              placeholder="Search followers"
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

      {/* Followers list */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {filteredFollowers.length > 0 ? (
          filteredFollowers.map((follower) => (
            <div
              key={follower.id}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                gap: spacing[3],
                transition: 'background-color 150ms ease-out',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/user/${follower.username}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Avatar */}
              <img
                src={follower.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${follower.username}`}
                alt={follower.displayName}
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
                    {follower.displayName}
                  </span>
                  {follower.isVerified && (
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
                  @{follower.username}
                </div>
                {follower.bio && (
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
                    {follower.bio}
                  </p>
                )}
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                  {formatNumber(follower.followerCount)} followers
                </div>
              </div>

              {/* Follow button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow(follower.id);
                }}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: '24px',
                  border: follower.isFollowing ? `1px solid ${colors.border.default}` : 'none',
                  backgroundColor: follower.isFollowing ? 'transparent' : colors.brand.primary,
                  color: follower.isFollowing ? colors.text.primary : 'white',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 150ms ease-out',
                  height: 'fit-content',
                }}
                onMouseEnter={(e) => {
                  if (follower.isFollowing) {
                    e.currentTarget.style.backgroundColor = colors.semantic.error + '20';
                    e.currentTarget.style.borderColor = colors.semantic.error;
                    e.currentTarget.style.color = colors.semantic.error;
                    e.currentTarget.textContent = 'Unfollow';
                  }
                }}
                onMouseLeave={(e) => {
                  if (follower.isFollowing) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = colors.border.default;
                    e.currentTarget.style.color = colors.text.primary;
                    e.currentTarget.textContent = 'Following';
                  }
                }}
              >
                {follower.isFollowing ? 'Following' : 'Follow'}
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
              No followers found for "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
