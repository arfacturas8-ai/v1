/**
 * UserProfilePage - View other user's profile (different from own ProfilePage)
 * Features:
 * - Banner and avatar
 * - Follow/Unfollow button with real-time state
 * - Message button
 * - More menu (Share, Report, Block, Mute)
 * - Stats (followers, following, posts, NFTs)
 * - Tabs (Posts, Replies, Media, Likes)
 * - Private account handling
 * - Blocked user handling
 * - Loading and error states
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  Share2,
  MessageCircle,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Lock,
  AlertCircle,
  UserX,
  Image as ImageIcon,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { colors, spacing, typography, radii, animation, shadows } from '../../design-system/tokens';
import { AppLayout } from '../AppLayout';
import { PostCard } from '../../design-system/molecules/PostCard';
import { NFTCard } from '../../design-system/organisms/NFTCard';
import { EmptyState } from '../../design-system/molecules/EmptyState';
import Menu from '../../components/molecules/Menu';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate: string;
  isVerified: boolean;
  isPrivate: boolean;
  isBlocked: boolean;
  isBlockedBy: boolean;
  isMuted: boolean;
  stats: {
    posts: number;
    followers: number;
    following: number;
    nfts: number;
  };
  isFollowing: boolean;
  isFollowedBy: boolean;
  hasRequestedFollow: boolean;
}

type TabType = 'posts' | 'replies' | 'media' | 'likes';

export const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Fetch user profile
  useEffect(() => {
    loadUserProfile();
  }, [username]);

  // Fetch content when tab changes
  useEffect(() => {
    if (profile) {
      loadTabContent();
    }
  }, [activeTab, profile]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock data - replace with actual API call
      const mockProfile: UserProfile = {
        id: '123',
        username: username || 'unknown',
        displayName: 'Sarah Anderson',
        avatar: 'https://i.pravatar.cc/300?u=sarah',
        banner: 'https://picsum.photos/1200/400?random=profile',
        bio: 'Digital artist & NFT creator. Building the future of Web3. 🎨✨\nAvailable for commissions.',
        location: 'Los Angeles, CA',
        website: 'https://sarahartworks.com',
        joinDate: 'March 2023',
        isVerified: true,
        isPrivate: false,
        isBlocked: false,
        isBlockedBy: false,
        isMuted: false,
        stats: {
          posts: 342,
          followers: 28500,
          following: 892,
          nfts: 47,
        },
        isFollowing: false,
        isFollowedBy: true,
        hasRequestedFollow: false,
      };

      setProfile(mockProfile);
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTabContent = async () => {
    setContentLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data based on tab
      if (activeTab === 'posts' || activeTab === 'replies') {
        setPosts(
          Array.from({ length: 5 }, (_, i) => ({
            id: `post-${i}`,
            author: {
              username: profile?.username,
              displayName: profile?.displayName,
              avatar: profile?.avatar,
              isVerified: profile?.isVerified,
            },
            content: [
              'Just finished a new piece! Really proud of how this turned out 🎨',
              'GM everyone! Working on something special today.',
              'Thanks for all the support on my latest collection! You all are amazing ❤️',
              'Behind the scenes of my creative process...',
              'New drop coming soon. Stay tuned! 👀',
            ][i % 5],
            createdAt: new Date(Date.now() - i * 86400000).toISOString(),
            likeCount: Math.floor(Math.random() * 500) + 50,
            repostCount: Math.floor(Math.random() * 100) + 10,
            replyCount: Math.floor(Math.random() * 50) + 5,
            bookmarkCount: Math.floor(Math.random() * 75) + 10,
            isLiked: false,
            media:
              i % 3 === 0
                ? [
                    {
                      type: 'IMAGE' as const,
                      url: `https://picsum.photos/800/600?random=${i}`,
                      thumbnail: `https://picsum.photos/400/300?random=${i}`,
                    },
                  ]
                : undefined,
          }))
        );
      } else if (activeTab === 'media') {
        setPosts(
          Array.from({ length: 8 }, (_, i) => ({
            id: `media-${i}`,
            author: {
              username: profile?.username,
              displayName: profile?.displayName,
              avatar: profile?.avatar,
              isVerified: profile?.isVerified,
            },
            content: 'Check out my latest work!',
            createdAt: new Date(Date.now() - i * 86400000).toISOString(),
            likeCount: Math.floor(Math.random() * 500) + 50,
            repostCount: Math.floor(Math.random() * 100) + 10,
            replyCount: Math.floor(Math.random() * 50) + 5,
            bookmarkCount: Math.floor(Math.random() * 75) + 10,
            isLiked: false,
            media: [
              {
                type: 'IMAGE' as const,
                url: `https://picsum.photos/800/600?random=media${i}`,
                thumbnail: `https://picsum.photos/400/300?random=media${i}`,
              },
            ],
          }))
        );
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setContentLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;

    setIsFollowLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setProfile({
        ...profile,
        isFollowing: !profile.isFollowing,
        hasRequestedFollow: profile.isPrivate ? !profile.hasRequestedFollow : false,
        stats: {
          ...profile.stats,
          followers: profile.isFollowing
            ? profile.stats.followers - 1
            : profile.stats.followers + 1,
        },
      });
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = () => {
    navigate(`/messages/${profile?.username}`);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/user/${profile?.username}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.displayName} (@${profile?.username})`,
          text: profile?.bio || '',
          url,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Profile link copied to clipboard!');
    }
  };

  const handleBlock = async () => {
    if (!confirm(`Are you sure you want to block @${profile?.username}?`)) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProfile((prev) => prev ? { ...prev, isBlocked: true } : null);
    } catch (err) {
      alert('Failed to block user');
    }
  };

  const handleMute = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProfile((prev) => prev ? { ...prev, isMuted: !prev.isMuted } : null);
      alert(`You have ${profile?.isMuted ? 'unmuted' : 'muted'} @${profile?.username}`);
    } catch (err) {
      alert('Failed to mute user');
    }
  };

  const handleReport = () => {
    navigate(`/report/user/${profile?.username}`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (error || !profile) {
    return (
      <AppLayout>
        <div
          style={{
            padding: spacing[8],
            textAlign: 'center',
          }}
        >
          <AlertCircle size={48} color={colors.semantic.error} />
          <h2
            style={{
              color: colors.text.primary,
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              marginTop: spacing[4],
              marginBottom: spacing[2],
            }}
          >
            {error || 'User not found'}
          </h2>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: spacing[4],
              padding: `${spacing[3]} ${spacing[6]}`,
              backgroundColor: colors.brand.primary,
              color: 'white',
              border: 'none',
              borderRadius: radii.full,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            Go Back
          </button>
        </div>
      </AppLayout>
    );
  }

  // Blocked state
  if (profile.isBlocked || profile.isBlockedBy) {
    return (
      <AppLayout>
        <div
          style={{
            padding: spacing[8],
            textAlign: 'center',
            maxWidth: '400px',
            margin: '0 auto',
          }}
        >
          <UserX size={64} color={colors.text.tertiary} />
          <h2
            style={{
              color: colors.text.primary,
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              marginTop: spacing[4],
              marginBottom: spacing[2],
            }}
          >
            {profile.isBlocked
              ? `You blocked @${profile.username}`
              : `You're blocked by @${profile.username}`}
          </h2>
          <p
            style={{
              color: colors.text.secondary,
              fontSize: typography.fontSize.base,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            {profile.isBlocked
              ? 'You cannot view their profile while they are blocked.'
              : 'You cannot view this profile.'}
          </p>
          {profile.isBlocked && (
            <button
              onClick={() => setProfile({ ...profile, isBlocked: false })}
              style={{
                marginTop: spacing[6],
                padding: `${spacing[3]} ${spacing[6]}`,
                backgroundColor: colors.brand.primary,
                color: 'white',
                border: 'none',
                borderRadius: radii.full,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
              }}
            >
              Unblock User
            </button>
          )}
        </div>
      </AppLayout>
    );
  }

  const canViewContent = !profile.isPrivate || profile.isFollowing;

  const getFollowButtonText = () => {
    if (profile.hasRequestedFollow) return 'Requested';
    if (profile.isFollowing) return 'Following';
    return 'Follow';
  };

  const moreMenuItems = [
    {
      id: 'share',
      label: 'Share profile',
      icon: <Share2 size={18} />,
    },
    {
      id: 'mute',
      label: profile.isMuted ? 'Unmute' : 'Mute',
      icon: <MessageCircle size={18} />,
    },
    {
      id: 'block',
      label: 'Block',
      icon: <UserX size={18} />,
      destructive: true,
    },
    {
      id: 'report',
      label: 'Report',
      icon: <AlertCircle size={18} />,
      destructive: true,
    },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
          padding: spacing[4],
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          <button
            onClick={() => navigate(-1)}
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
          <div>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              {profile.displayName}
            </h1>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
                margin: 0,
              }}
            >
              {formatNumber(profile.stats.posts)} posts
            </p>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div
        style={{
          height: '200px',
          backgroundImage: profile.banner ? `url(${profile.banner})` : 'none',
          backgroundColor: colors.bg.tertiary,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%)',
          }}
        />
      </div>

      {/* Profile Info */}
      <div style={{ padding: spacing[4] }}>
        {/* Avatar and Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: '-48px',
            marginBottom: spacing[4],
          }}
        >
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: radii.full,
              overflow: 'hidden',
              backgroundColor: colors.bg.tertiary,
              border: `4px solid ${colors.bg.primary}`,
              boxShadow: shadows.lg,
            }}
          >
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.displayName}
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
                  fontSize: typography.fontSize['3xl'],
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {profile.displayName[0]}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: spacing[2] }}>
            <button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: radii.full,
                border: profile.isFollowing ? `1px solid ${colors.border.default}` : 'none',
                backgroundColor: profile.isFollowing ? 'transparent' : colors.brand.primary,
                color: profile.isFollowing ? colors.text.primary : 'white',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: isFollowLoading ? 'wait' : 'pointer',
                transition: `all ${animation.duration.fast}`,
                opacity: isFollowLoading ? 0.6 : 1,
              }}
            >
              {getFollowButtonText()}
            </button>
            <button
              onClick={handleMessage}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: radii.full,
                border: `1px solid ${colors.border.default}`,
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <MessageCircle size={18} color={colors.text.primary} />
            </button>
            <Menu
              items={moreMenuItems}
              trigger={
                <button
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: radii.full,
                    border: `1px solid ${colors.border.default}`,
                    backgroundColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <MoreVertical size={18} color={colors.text.primary} />
                </button>
              }
              onItemClick={(id) => {
                if (id === 'share') handleShare();
                if (id === 'mute') handleMute();
                if (id === 'block') handleBlock();
                if (id === 'report') handleReport();
              }}
            />
          </div>
        </div>

        {/* Name and Verification */}
        <div style={{ marginBottom: spacing[2] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <h2
              style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              {profile.displayName}
            </h2>
            {profile.isVerified && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
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
            {profile.isPrivate && (
              <Lock size={16} color={colors.text.tertiary} />
            )}
          </div>
          <div
            style={{
              color: colors.text.tertiary,
              fontSize: typography.fontSize.base,
            }}
          >
            @{profile.username}
          </div>
          {profile.isFollowedBy && (
            <div
              style={{
                display: 'inline-block',
                marginTop: spacing[2],
                padding: `${spacing[1]} ${spacing[2]}`,
                backgroundColor: colors.bg.tertiary,
                color: colors.text.secondary,
                fontSize: typography.fontSize.xs,
                borderRadius: radii.sm,
              }}
            >
              Follows you
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p
            style={{
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing[4],
              whiteSpace: 'pre-wrap',
            }}
          >
            {profile.bio}
          </p>
        )}

        {/* Meta Info */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing[4],
            marginBottom: spacing[4],
          }}
        >
          {profile.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <MapPin size={16} color={colors.text.tertiary} />
              <span style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                {profile.location}
              </span>
            </div>
          )}
          {profile.website && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <LinkIcon size={16} color={colors.text.tertiary} />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: colors.brand.primary,
                  fontSize: typography.fontSize.sm,
                  textDecoration: 'none',
                }}
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <Calendar size={16} color={colors.text.tertiary} />
            <span style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
              Joined {profile.joinDate}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: spacing[6], marginBottom: spacing[6] }}>
          <button
            onClick={() => navigate(`/user/${profile.username}/following`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span style={{ color: colors.text.primary, fontSize: typography.fontSize.base }}>
              <span style={{ fontWeight: typography.fontWeight.bold }}>
                {formatNumber(profile.stats.following)}
              </span>
              <span style={{ color: colors.text.secondary, marginLeft: spacing[1] }}>Following</span>
            </span>
          </button>
          <button
            onClick={() => navigate(`/user/${profile.username}/followers`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span style={{ color: colors.text.primary, fontSize: typography.fontSize.base }}>
              <span style={{ fontWeight: typography.fontWeight.bold }}>
                {formatNumber(profile.stats.followers)}
              </span>
              <span style={{ color: colors.text.secondary, marginLeft: spacing[1] }}>Followers</span>
            </span>
          </button>
          {profile.stats.nfts > 0 && (
            <div>
              <span style={{ color: colors.text.primary, fontSize: typography.fontSize.base }}>
                <span style={{ fontWeight: typography.fontWeight.bold }}>
                  {formatNumber(profile.stats.nfts)}
                </span>
                <span style={{ color: colors.text.secondary, marginLeft: spacing[1] }}>NFTs</span>
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.border.default}`,
            marginBottom: spacing[4],
          }}
        >
          {(['posts', 'replies', 'media', 'likes'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: `${spacing[3]} ${spacing[4]}`,
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? colors.brand.primary : 'transparent'}`,
                color: activeTab === tab ? colors.text.primary : colors.text.secondary,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: `all ${animation.duration.fast}`,
                textTransform: 'capitalize',
              }}
            >
              {tab === 'media' && <ImageIcon size={18} style={{ verticalAlign: 'middle', marginRight: spacing[1] }} />}
              {tab === 'likes' && <Heart size={18} style={{ verticalAlign: 'middle', marginRight: spacing[1] }} />}
              {tab === 'replies' && <MessageSquare size={18} style={{ verticalAlign: 'middle', marginRight: spacing[1] }} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {!canViewContent ? (
          <div style={{ textAlign: 'center', padding: spacing[8] }}>
            <Lock size={48} color={colors.text.tertiary} />
            <h3
              style={{
                color: colors.text.primary,
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                marginTop: spacing[4],
                marginBottom: spacing[2],
              }}
            >
              This account is private
            </h3>
            <p
              style={{
                color: colors.text.secondary,
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              Follow this account to see their posts
            </p>
          </div>
        ) : posts.length === 0 && !contentLoading ? (
          <EmptyState
            icon={<span style={{ fontSize: '48px' }}>📭</span>}
            title={`No ${activeTab} yet`}
            description={`This user hasn't ${activeTab === 'posts' ? 'posted' : activeTab === 'likes' ? 'liked' : 'shared'} anything yet`}
          />
        ) : !contentLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostClick={() => navigate(`/post/${post.id}`)}
                onUserClick={() => navigate(`/user/${post.author.username}`)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};

export default UserProfilePage;
