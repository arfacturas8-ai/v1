/**
 * FollowingListPage - View user's following list
 * Features:
 * - User cards with avatar, name, bio
 * - Follow/unfollow buttons
 * - Search functionality
 * - Filter tabs (All, Creators, Friends)
 * - Infinite scroll
 * - Empty state
 * - Loading states
 * - Sort options
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users, Sparkles, UserHeart, ArrowUpDown } from 'lucide-react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

interface Following {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isFollowedBy: boolean;
  isCreator: boolean;
  followerCount: number;
  followedAt: string;
}

type FilterType = 'all' | 'creators' | 'friends';
type SortType = 'recent' | 'oldest' | 'alphabetical';

export const FollowingListPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [following, setFollowing] = useState<Following[]>([]);
  const [filteredFollowing, setFilteredFollowing] = useState<Following[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  // Load initial following
  useEffect(() => {
    loadFollowing();
  }, [username]);

  // Filter, search, and sort
  useEffect(() => {
    let filtered = [...following];

    // Apply filter
    if (activeFilter === 'creators') {
      filtered = filtered.filter((f) => f.isCreator);
    } else if (activeFilter === 'friends') {
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

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.followedAt).getTime() - new Date(b.followedAt).getTime();
      } else {
        return a.displayName.localeCompare(b.displayName);
      }
    });

    setFilteredFollowing(filtered);
  }, [following, activeFilter, searchQuery, sortBy]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreFollowing();
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

  const loadFollowing = async () => {
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data
      const mockFollowing: Following[] = Array.from({ length: 20 }, (_, i) => ({
        id: `following-${i}`,
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
        avatar: `https://i.pravatar.cc/300?u=following${i}`,
        bio:
          i % 3 === 0
            ? [
                'Digital creator & NFT artist 🎨',
                'Building innovative Web3 solutions 🚀',
                'Crypto enthusiast | DeFi explorer',
                'Designer, coder, creator ✨',
                'Collector of digital masterpieces',
              ][i % 5]
            : undefined,
        isVerified: i % 4 === 0,
        isFollowedBy: i % 5 === 0,
        isCreator: i % 3 === 0,
        followerCount: Math.floor(Math.random() * 100000) + 500,
        followedAt: new Date(Date.now() - i * 86400000 * 7).toISOString(),
      }));

      setFollowing(mockFollowing);
      setHasMore(true);
      setPage(1);
    } catch (err) {
      console.error('Failed to load following:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreFollowing = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const nextPage = page + 1;
      const newFollowing: Following[] = Array.from({ length: 10 }, (_, i) => ({
        id: `following-${page * 20 + i}`,
        username: `user${page * 20 + i}`,
        displayName: `User ${page * 20 + i}`,
        avatar: `https://i.pravatar.cc/300?u=following${page * 20 + i}`,
        bio: i % 2 === 0 ? 'Another awesome user' : undefined,
        isVerified: i % 6 === 0,
        isFollowedBy: i % 7 === 0,
        isCreator: i % 4 === 0,
        followerCount: Math.floor(Math.random() * 20000) + 100,
        followedAt: new Date(Date.now() - (page * 20 + i) * 86400000 * 7).toISOString(),
      }));

      setFollowing((prev) => [...prev, ...newFollowing]);
      setPage(nextPage);

      if (nextPage >= 3) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more following:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    const user = following.find((f) => f.id === userId);
    if (!user) return;

    if (!confirm(`Are you sure you want to unfollow @${user.username}?`)) return;

    setFollowing((prev) => prev.filter((f) => f.id !== userId));

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      // Revert on error
      setFollowing((prev) => [...prev, user]);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const creatorsCount = following.filter((f) => f.isCreator).length;
  const friendsCount = following.filter((f) => f.isFollowedBy).length;

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
              {username ? `@${username}'s following` : 'Following'}
            </h1>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
                margin: 0,
              }}
            >
              {formatNumber(following.length)} following
            </p>
          </div>

          {/* Sort Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: radii.full,
                border: `1px solid ${colors.border.default}`,
                backgroundColor: 'transparent',
                color: colors.text.primary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
              }}
            >
              <ArrowUpDown size={16} />
              Sort
            </button>

            {showSortMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: spacing[2],
                  backgroundColor: colors.bg.elevated,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: radii.lg,
                  minWidth: '160px',
                  padding: spacing[2],
                  zIndex: 1000,
                }}
              >
                {[
                  { value: 'recent' as SortType, label: 'Most Recent' },
                  { value: 'oldest' as SortType, label: 'Oldest First' },
                  { value: 'alphabetical' as SortType, label: 'Alphabetical' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: `${spacing[2]} ${spacing[3]}`,
                      backgroundColor:
                        sortBy === option.value ? colors.bg.hover : 'transparent',
                      border: 'none',
                      borderRadius: radii.md,
                      color: colors.text.primary,
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.medium,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: `background-color ${animation.duration.fast}`,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
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
            onClick={() => setActiveFilter('creators')}
            style={{
              flex: 1,
              padding: `${spacing[3]} ${spacing[4]}`,
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeFilter === 'creators' ? colors.brand.primary : 'transparent'}`,
              color: activeFilter === 'creators' ? colors.text.primary : colors.text.secondary,
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
            <Sparkles size={18} />
            Creators ({creatorsCount})
          </button>
          <button
            onClick={() => setActiveFilter('friends')}
            style={{
              flex: 1,
              padding: `${spacing[3]} ${spacing[4]}`,
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeFilter === 'friends' ? colors.brand.primary : 'transparent'}`,
              color: activeFilter === 'friends' ? colors.text.primary : colors.text.secondary,
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
            <UserHeart size={18} />
            Friends ({friendsCount})
          </button>
        </div>
      </header>

      {/* Following List */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {isLoading ? (
          <div style={{ padding: spacing[4] }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <FollowingCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredFollowing.length > 0 ? (
          <>
            {filteredFollowing.map((user, index) => (
              <div
                key={user.id}
                ref={index === filteredFollowing.length - 1 ? lastElementRef : null}
              >
                <FollowingCard user={user} onUnfollow={handleUnfollow} navigate={navigate} />
              </div>
            ))}

            {isLoadingMore && (
              <div style={{ padding: spacing[4] }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <FollowingCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!hasMore && filteredFollowing.length > 0 && (
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
                ? 'No users found'
                : activeFilter === 'creators'
                ? 'No creators'
                : activeFilter === 'friends'
                ? 'No friends yet'
                : 'Not following anyone'}
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
                : activeFilter === 'creators'
                ? 'Follow some creators to see them here'
                : activeFilter === 'friends'
                ? 'Users who follow you back will appear here'
                : 'Start following users to build your network'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const FollowingCard: React.FC<{
  user: Following;
  onUnfollow: (id: string) => void;
  navigate: (path: string) => void;
}> = ({ user, onUnfollow, navigate }) => {
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
      onClick={() => navigate(`/user/${user.username}`)}
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
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.displayName}
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
            {user.displayName[0]}
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
            {user.displayName}
          </span>
          {user.isVerified && (
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
          {user.isCreator && (
            <Sparkles size={14} color={colors.semantic.warning} />
          )}
          {user.isFollowedBy && (
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

      {/* Following Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUnfollow(user.id);
        }}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
        style={{
          padding: `${spacing[2]} ${spacing[4]}`,
          borderRadius: radii.full,
          border: `1px solid ${buttonHovered ? colors.semantic.error : colors.border.default}`,
          backgroundColor: buttonHovered ? colors.semantic.error + '20' : 'transparent',
          color: buttonHovered ? colors.semantic.error : colors.text.primary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          cursor: 'pointer',
          flexShrink: 0,
          transition: `all ${animation.duration.fast}`,
          height: 'fit-content',
          whiteSpace: 'nowrap',
        }}
      >
        {buttonHovered ? 'Unfollow' : 'Following'}
      </button>
    </div>
  );
};

const FollowingCardSkeleton: React.FC = () => (
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
        width: '90px',
        height: '32px',
        backgroundColor: colors.bg.tertiary,
        borderRadius: radii.full,
      }}
    />
  </div>
);

export default FollowingListPage;
