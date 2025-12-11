import React, { useState, useEffect } from 'react';
import { Settings, Calendar, MapPin, Link as LinkIcon, MoreVertical, Share2 } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { TabBar } from '../design-system/molecules/TabBar';
import { Avatar } from '../design-system/atoms/Avatar';
import { Text } from '../design-system/atoms/Text';
import { Button } from '../design-system/atoms/Button';
import { Badge } from '../design-system/atoms/Badge';
import { PostCard } from '../design-system/molecules/PostCard';
import { NFTCard } from '../design-system/organisms/NFTCard';
import { CollectionCard } from '../design-system/organisms/CollectionCard';
import { EmptyState } from '../design-system/molecules/EmptyState';
import { Skeleton } from '../design-system/atoms/Skeleton';
import { colors, spacing, radii, typography, shadows } from '../design-system/tokens';

interface ProfilePageProps {
  onNavigate?: (route: string, params?: any) => void;
  username?: string; // If provided, shows that user's profile; otherwise shows own profile
}

// Mock user data
const mockUserProfile = {
  username: 'yourhandle',
  displayName: 'Your Name',
  avatar: 'https://i.pravatar.cc/300?u=profile',
  banner: 'https://picsum.photos/1200/400?random=banner',
  bio: 'Digital creator and NFT enthusiast. Building the future of Web3 social. 🚀',
  location: 'San Francisco, CA',
  website: 'https://example.com',
  joinDate: 'January 2024',
  isVerified: true,
  stats: {
    posts: 127,
    followers: 12500,
    following: 350,
  },
};

// Mock data generators
const generateMockPost = (id: number) => ({
  id: `post-${id}`,
  author: {
    username: mockUserProfile.username,
    displayName: mockUserProfile.displayName,
    avatar: mockUserProfile.avatar,
    isVerified: mockUserProfile.isVerified,
  },
  content: [
    'Just finished my latest piece! What do you think?',
    'GM everyone! Excited to share my new collection soon.',
    'The creative process is the best part. Here\'s a behind-the-scenes look.',
    'Thank you all for the amazing support! You\'re the best community.',
    'Working on something special. Stay tuned...',
  ][id % 5],
  createdAt: new Date(Date.now() - id * 86400000).toISOString(),
  likeCount: Math.floor(Math.random() * 500) + 50,
  repostCount: Math.floor(Math.random() * 100) + 10,
  replyCount: Math.floor(Math.random() * 50) + 5,
  bookmarkCount: Math.floor(Math.random() * 75) + 10,
  isLiked: Math.random() > 0.5,
  media:
    id % 2 === 0
      ? [
          {
            type: 'IMAGE' as const,
            url: `https://picsum.photos/800/600?random=profile${id}`,
            thumbnail: `https://picsum.photos/400/300?random=profile${id}`,
          },
        ]
      : undefined,
});

const generateMockNFT = (id: number) => ({
  id: `nft-${id}`,
  imageUrl: `https://picsum.photos/400/400?random=profilenft${id}`,
  name: `My NFT #${id}`,
  collectionName: 'My Collection',
  creatorAvatar: mockUserProfile.avatar,
  creatorName: mockUserProfile.displayName,
  creatorVerified: true,
  price: { amount: (Math.random() * 2).toFixed(2), currency: 'ETH' },
  likes: Math.floor(Math.random() * 200),
  views: Math.floor(Math.random() * 2000),
  isLiked: false,
});

const generateMockCollection = (id: number) => ({
  id: `collection-${id}`,
  coverUrl: `https://picsum.photos/800/300?random=profilecoll${id}`,
  avatarUrl: mockUserProfile.avatar,
  name: `Collection ${id}`,
  creatorName: mockUserProfile.displayName,
  creatorVerified: true,
  itemCount: Math.floor(Math.random() * 500) + 50,
  floorPrice: { amount: (Math.random() * 1).toFixed(2), currency: 'ETH' },
  volume: { amount: Math.floor(Math.random() * 500), currency: 'ETH' },
});

const generateMockActivity = (id: number) => {
  const types = ['post', 'like', 'repost', 'nft_mint', 'nft_sale', 'follow'];
  const type = types[id % types.length];

  return {
    id: `activity-${id}`,
    type,
    timestamp: new Date(Date.now() - id * 3600000).toISOString(),
    description:
      type === 'post'
        ? 'Posted a new update'
        : type === 'like'
        ? 'Liked a post'
        : type === 'repost'
        ? 'Reposted'
        : type === 'nft_mint'
        ? 'Minted an NFT'
        : type === 'nft_sale'
        ? 'Sold an NFT'
        : 'Followed a user',
  };
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, username }) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(mockUserProfile);
  const [posts, setPosts] = useState<any[]>([]);
  const [nfts, setNFTs] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const isOwnProfile = !username || username === profile.username;

  useEffect(() => {
    loadProfileData();
  }, [activeTab]);

  const loadProfileData = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (activeTab === 'posts') {
      setPosts(Array.from({ length: 8 }, (_, i) => generateMockPost(i)));
    } else if (activeTab === 'nfts') {
      setNFTs(Array.from({ length: 6 }, (_, i) => generateMockNFT(i)));
    } else if (activeTab === 'collections') {
      setCollections(Array.from({ length: 4 }, (_, i) => generateMockCollection(i)));
    } else if (activeTab === 'activity') {
      setActivities(Array.from({ length: 12 }, (_, i) => generateMockActivity(i)));
    }

    setIsLoading(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const tabs = [
    { id: 'posts', label: 'Posts', badge: profile.stats.posts },
    { id: 'nfts', label: 'NFTs' },
    { id: 'collections', label: 'Collections' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <AppLayout
      activeTab="profile"
      onTabChange={(tab) => onNavigate?.(`/${tab}`)}
      onSearch={() => onNavigate?.('/search')}
      onNotifications={() => onNavigate?.('/notifications')}
      onWallet={() => onNavigate?.('/wallet')}
    >
      {/* Banner */}
      <div
        style={{
          height: '200px',
          backgroundImage: `url(${profile.banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 100%)',
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
          <Avatar
            src={profile.avatar}
            alt={profile.displayName}
            size="xl"
            fallback={profile.displayName[0]}
            style={{
              border: `4px solid ${colors.bg.primary}`,
              boxShadow: shadows.lg,
            }}
          />

          <div style={{ display: 'flex', gap: spacing[2] }}>
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="md"
                leftIcon={<Settings size={18} />}
                onClick={() => onNavigate?.('/settings/profile')}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="primary" size="md">
                  Follow
                </Button>
                <Button variant="outline" size="md">
                  Message
                </Button>
              </>
            )}
            <Button variant="ghost" size="md" iconOnly>
              <Share2 size={18} />
            </Button>
          </div>
        </div>

        {/* Name and Verification */}
        <div style={{ marginBottom: spacing[2] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <Text size="2xl" weight="bold">
              {profile.displayName}
            </Text>
            {profile.isVerified && <Badge variant="success" size="md">✓ Verified</Badge>}
          </div>
          <Text variant="secondary" size="base">
            @{profile.username}
          </Text>
        </div>

        {/* Bio */}
        {profile.bio && (
          <Text
            size="base"
            style={{
              marginBottom: spacing[4],
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            {profile.bio}
          </Text>
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
              <Text variant="secondary" size="sm">
                {profile.location}
              </Text>
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
            <Text variant="secondary" size="sm">
              Joined {profile.joinDate}
            </Text>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: spacing[6],
            marginBottom: spacing[6],
          }}
        >
          <button
            onClick={() => onNavigate?.(`/user/${profile.username}/posts`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Text size="base">
              <span style={{ fontWeight: typography.fontWeight.bold }}>
                {formatNumber(profile.stats.posts)}
              </span>
              <span style={{ color: colors.text.secondary, marginLeft: spacing[1] }}>Posts</span>
            </Text>
          </button>
          <button
            onClick={() => onNavigate?.(`/user/${profile.username}/followers`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Text size="base">
              <span style={{ fontWeight: typography.fontWeight.bold }}>
                {formatNumber(profile.stats.followers)}
              </span>
              <span style={{ color: colors.text.secondary, marginLeft: spacing[1] }}>Followers</span>
            </Text>
          </button>
          <button
            onClick={() => onNavigate?.(`/user/${profile.username}/following`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Text size="base">
              <span style={{ fontWeight: typography.fontWeight.bold }}>
                {formatNumber(profile.stats.following)}
              </span>
              <span style={{ color: colors.text.secondary, marginLeft: spacing[1] }}>Following</span>
            </Text>
          </button>
        </div>

        {/* Tabs */}
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
      </div>

      {/* Tab Content */}
      <div style={{ padding: spacing[4] }}>
        {activeTab === 'posts' && !isLoading ? (
          posts.length === 0 ? (
            <EmptyState
              icon={<span style={{ fontSize: '48px' }}>📝</span>}
              title="No posts yet"
              description={isOwnProfile ? 'Share your first post with your followers' : 'This user hasn\'t posted anything yet'}
              action={
                isOwnProfile
                  ? {
                      label: 'Create Post',
                      onClick: () => onNavigate?.('/compose'),
                    }
                  : undefined
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostClick={() => onNavigate?.(`/post/${post.id}`)}
                  onUserClick={() => onNavigate?.(`/user/${post.author.username}`)}
                />
              ))}
            </div>
          )
        ) : activeTab === 'nfts' && !isLoading ? (
          nfts.length === 0 ? (
            <EmptyState
              icon={<span style={{ fontSize: '48px' }}>🖼️</span>}
              title="No NFTs yet"
              description={isOwnProfile ? 'Create your first NFT to get started' : 'This user doesn\'t have any NFTs'}
              action={
                isOwnProfile
                  ? {
                      label: 'Create NFT',
                      onClick: () => onNavigate?.('/create/nft'),
                    }
                  : undefined
              }
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: spacing[3],
              }}
            >
              {nfts.map((nft) => (
                <NFTCard
                  key={nft.id}
                  {...nft}
                  variant="compact"
                  onClick={() => onNavigate?.(`/nft/${nft.id}`)}
                />
              ))}
            </div>
          )
        ) : activeTab === 'collections' && !isLoading ? (
          collections.length === 0 ? (
            <EmptyState
              icon={<span style={{ fontSize: '48px' }}>📁</span>}
              title="No collections yet"
              description={isOwnProfile ? 'Create a collection to organize your NFTs' : 'This user doesn\'t have any collections'}
              action={
                isOwnProfile
                  ? {
                      label: 'Create Collection',
                      onClick: () => onNavigate?.('/create/collection'),
                    }
                  : undefined
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  {...collection}
                  onClick={() => onNavigate?.(`/collection/${collection.id}`)}
                />
              ))}
            </div>
          )
        ) : !isLoading ? (
          // Activity
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};


// Activity Item Component
const ActivityItem: React.FC<{ activity: any }> = ({ activity }) => {
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      style={{
        padding: spacing[3],
        borderRadius: radii.md,
        backgroundColor: colors.bg.secondary,
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
      }}
    >
      <div
        style={{
          fontSize: typography.fontSize.xl,
        }}
      >
        {activity.type === 'post'
          ? '📝'
          : activity.type === 'like'
          ? '❤️'
          : activity.type === 'repost'
          ? '🔁'
          : activity.type === 'nft_mint'
          ? '🎨'
          : activity.type === 'nft_sale'
          ? '💰'
          : '👤'}
      </div>
      <div style={{ flex: 1 }}>
        <Text size="sm">{activity.description}</Text>
      </div>
      <Text size="xs" variant="tertiary">
        {formatTime(activity.timestamp)}
      </Text>
    </div>
  );
};

export default ProfilePage;
