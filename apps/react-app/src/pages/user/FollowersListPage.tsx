/**
 * FollowersListPage - View user's followers
 * Features:
 * - User cards with avatar, name, bio
 * - Follow/unfollow buttons
 * - Search functionality
 * - Filter tabs (All, Mutual)
 * - Infinite scroll
 * - Empty state
 * - Loading states
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users, UserCheck } from 'lucide-react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

interface Follower {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
  followerCount: number;
}

type FilterType = 'all' | 'mutual';

export const FollowersListPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [followers, setFollowers] = useState<Follower[]>([]);
  const [filteredFollowers, setFilteredFollowers] = useState<Follower[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  // Load initial followers
  useEffect(() => {
    loadFollowers();
  }, [username]);

  // Filter and search
  useEffect(() => {
    let filtered = followers;

    // Apply filter
    if (activeFilter === 'mutual') {
      filtered = filtered.filter((f) => f.isFollowedBy);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.displayName.toLowerCase().includes(query) ||
          f.username.toLowerCase().includes(query) ||
          f.bio?.toLowerCase().includes(query)
      );
    }

    setFilteredFollowers(filtered);
  }, [followers, activeFilter, searchQuery]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreFollowers();
        }
      },
      { threshold: 0.1 }
    );

    if (lastElementRef.current) {
      observerRef.current.observe(lastElementRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoadingMore]);

  const loadFollowers = async () => {
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data
      const mockFollowers: Follower[] = Array.from({ length: 20 }, (_, i) => ({
        id: `follower-${i}`,
        username: `user${i}`,
        displayName: [
          'Alex Johnson',
          'Sarah Williams',
          'Michael Chen',
          'Emma Davis',
          'James Wilson',
          'Olivia Brown',
          'William Garcia',
          'Sophia Martinez',
          'Benjamin Lee',
          'Isabella Anderson',
        ][i % 10],
        avatar: `https://i.pravatar.cc/300?u=follower${i}`,
        bio:
          i % 3 === 0
            ? [
                'Digital creator & NFT enthusiast 🎨',
                'Building the future of Web3 🚀',
                'Crypto investor | DeFi explorer',
                'Artist, developer, dreamer ✨',
                'Collector of rare digital art',
              ][i % 5]
            : undefined,
        isVerified: i % 4 === 0,
        isFollowing: i % 3 === 0,
        isFollowedBy: i % 5 === 0,
        followerCount: Math.floor(Math.random() * 50000) + 100,
      }));

      setFollowers(mockFollowers);
      setHasMore(true);
      setPage(1);
    } catch (err) {
      console.error('Failed to load followers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreFollowers = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data for next page
      const nextPage = page + 1;
      const newFollowers: Follower[] = Array.from({ length: 10 }, (_, i) => ({
        id: `follower-${page * 20 + i}`,
        username: `user${page * 20 + i}`,
        displayName: `User ${page * 20 + i}`,
        avatar: `https://i.pravatar.cc/300?u=follower${page * 20 + i}`,
        bio: i % 2 === 0 ? 'Another amazing user on the platform' : undefined,
        isVerified: i % 5 === 0,
        isFollowing: i % 4 === 0,
        isFollowedBy: i % 6 === 0,
        followerCount: Math.floor(Math.random() * 10000) + 50,
      }));

      setFollowers((prev) => [...prev, ...newFollowers]);
      setPage(nextPage);

      // Simulate end of list
      if (nextPage >= 3) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more followers:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleFollow = async (followerId: string) => {
    setFollowers((prev) =>
      prev.map((f) =>
        f.id === followerId
          ? {
              ...f,
              isFollowing: !f.isFollowing,
              followerCount: f.isFollowing ? f.followerCount - 1 : f.followerCount + 1,
            }
          : f
      )
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      // Revert on error
      setFollowers((prev) =>
        prev.map((f) =>
          f.id === followerId
            ? {
                ...f,
                isFollowing: !f.isFollowing,
                followerCount: f.isFollowing ? f.followerCount + 1 : f.followerCount - 1,
              }
            : f
        )
      );
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const mutualCount = followers.filter((f) => f.isFollowedBy).length;

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
              borderRadius: radii.full,
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: `background-color ${animation.duration.fast}`,
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
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
                margin: 0,
              }}
            >
              {formatNumber(followers.length)} {followers.length === 1 ? 'follower' : 'followers'}
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
                borderRadius: radii.full,
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
                transition: `border-color ${animation.duration.fast}`,
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

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              flex: 1,
              padding: `${spacing[3]} ${spacing[4]}`,
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeFilter === 'all' ? colors.brand.primary : 'transparent'}`,
              color: activeFilter === 'all' ? colors.text.primary : colors.text.secondary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: `all ${animation.duration.fast}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
            }}
          >
            <Users size={18} />
            All
          </button>
          <button
            onClick={() => setActiveFilter('mutual')}
            style={{
              flex: 1,
              padding: `${spacing[3]} ${spacing[4]}`,
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeFilter === 'mutual' ? colors.brand.primary : 'transparent'}`,
              color: activeFilter === 'mutual' ? colors.text.primary : colors.text.secondary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: `all ${animation.duration.fast}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
            }}
          >
            <UserCheck size={18} />
            Mutual ({mutualCount})
          </button>
        </div>
      </header>

      {/* Followers List */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {isLoading ? (
          <div style={{ padding: spacing[4] }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <FollowerCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredFollowers.length > 0 ? (
          <>
            {filteredFollowers.map((follower, index) => (
              <div
                key={follower.id}
                ref={index === filteredFollowers.length - 1 ? lastElementRef : null}
              >
                <FollowerCard follower={follower} onFollow={handleFollow} navigate={navigate} />
              </div>
            ))}

            {isLoadingMore && (
              <div style={{ padding: spacing[4] }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <FollowerCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!hasMore && filteredFollowers.length > 0 && (
              <div
                style={{
                  padding: spacing[6],
                  textAlign: 'center',
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.sm,
                }}
              >
                You've reached the end of the list
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              padding: spacing[8],
              textAlign: 'center',
            }}
          >
            <Users size={48} color={colors.text.tertiary} />
            <h2
              style={{
                color: colors.text.primary,
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                marginTop: spacing[4],
                marginBottom: spacing[2],
              }}
            >
              {searchQuery
                ? 'No followers found'
                : activeFilter === 'mutual'
                ? 'No mutual followers'
                : 'No followers yet'}
            </h2>
            <p
              style={{
                color: colors.text.secondary,
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              {searchQuery
                ? `No results for "${searchQuery}"`
                : activeFilter === 'mutual'
                ? 'No mutual connections yet'
                : 'This user has no followers yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const FollowerCard: React.FC<{
  follower: Follower;
  onFollow: (id: string) => void;
  navigate: (path: string) => void;
}> = ({ follower, onFollow, navigate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div
      style={{
        padding: spacing[4],
        borderBottom: `1px solid ${colors.border.default}`,
        display: 'flex',
        gap: spacing[3],
        backgroundColor: isHovered ? colors.bg.hover : 'transparent',
        transition: `background-color ${animation.duration.fast}`,
        cursor: 'pointer',
      }}
      onClick={() => navigate(`/user/${follower.username}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: radii.full,
          overflow: 'hidden',
          backgroundColor: colors.bg.tertiary,
          flexShrink: 0,
        }}
      >
        {follower.avatar ? (
          <img
            src={follower.avatar}
            alt={follower.displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: colors.brand.gradient,
              color: 'white',
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
            }}
          >
            {follower.displayName[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            marginBottom: spacing[1],
          }}
        >
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: radii.full,
                backgroundColor: colors.brand.primary,
                color: 'white',
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              ✓
            </div>
          )}
          {follower.isFollowedBy && (
            <span
              style={{
                padding: `${spacing[0]} ${spacing[2]}`,
                backgroundColor: colors.bg.tertiary,
                color: colors.text.secondary,
                fontSize: typography.fontSize.xs,
                borderRadius: radii.full,
              }}
            >
              Follows you
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.tertiary,
            marginBottom: spacing[1],
          }}
        >
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

      {/* Follow Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFollow(follower.id);
        }}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
        style={{
          padding: `${spacing[2]} ${spacing[4]}`,
          borderRadius: radii.full,
          border: follower.isFollowing ? `1px solid ${colors.border.default}` : 'none',
          backgroundColor: follower.isFollowing
            ? buttonHovered
              ? colors.semantic.error + '20'
              : 'transparent'
            : colors.brand.primary,
          color: follower.isFollowing
            ? buttonHovered
              ? colors.semantic.error
              : colors.text.primary
            : 'white',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          cursor: 'pointer',
          flexShrink: 0,
          transition: `all ${animation.duration.fast}`,
          height: 'fit-content',
          whiteSpace: 'nowrap',
        }}
      >
        {follower.isFollowing ? (buttonHovered ? 'Unfollow' : 'Following') : 'Follow'}
      </button>
    </div>
  );
};

const FollowerCardSkeleton: React.FC = () => (
  <div
    style={{
      padding: spacing[4],
      borderBottom: `1px solid ${colors.border.default}`,
      display: 'flex',
      gap: spacing[3],
    }}
  >
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: radii.full,
        backgroundColor: colors.bg.tertiary,
        flexShrink: 0,
      }}
    />
    <div style={{ flex: 1 }}>
      <div
        style={{
          width: '60%',
          height: '16px',
          backgroundColor: colors.bg.tertiary,
          borderRadius: radii.sm,
          marginBottom: spacing[2],
        }}
      />
      <div
        style={{
          width: '40%',
          height: '14px',
          backgroundColor: colors.bg.tertiary,
          borderRadius: radii.sm,
          marginBottom: spacing[2],
        }}
      />
      <div
        style={{
          width: '80%',
          height: '14px',
          backgroundColor: colors.bg.tertiary,
          borderRadius: radii.sm,
        }}
      />
    </div>
    <div
      style={{
        width: '80px',
        height: '32px',
        backgroundColor: colors.bg.tertiary,
        borderRadius: radii.full,
      }}
    />
  </div>
);

export default FollowersListPage;
