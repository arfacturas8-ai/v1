import React, { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '../../design-system/atoms/Button';
import { Avatar } from '../../design-system/atoms/Avatar';
import { Badge } from '../../design-system/atoms/Badge';
import { colors, spacing, typography, radii } from '../../design-system/tokens';

interface FollowSuggestionsStepProps {
  onNext: () => void;
  onSkip: () => void;
}

const suggestedCreators = [
  {
    id: '1',
    username: 'cryptoartist',
    displayName: 'Crypto Artist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoartist',
    bio: 'Digital artist creating NFT collections',
    followers: 125000,
    isVerified: true,
  },
  {
    id: '2',
    username: 'web3builder',
    displayName: 'Web3 Builder',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=web3builder',
    bio: 'Building the decentralized future',
    followers: 89000,
    isVerified: true,
  },
  {
    id: '3',
    username: 'nftcollector',
    displayName: 'NFT Collector',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=nftcollector',
    bio: 'Collecting rare digital assets',
    followers: 56000,
    isVerified: false,
  },
  {
    id: '4',
    username: 'defiwhale',
    displayName: 'DeFi Whale',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=defiwhale',
    bio: 'Yield farming and DeFi strategies',
    followers: 112000,
    isVerified: true,
  },
  {
    id: '5',
    username: 'metaverse_dev',
    displayName: 'Metaverse Dev',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=metaverse',
    bio: 'Building virtual worlds',
    followers: 67000,
    isVerified: false,
  },
];

export const FollowSuggestionsStep: React.FC<FollowSuggestionsStepProps> = ({ onNext, onSkip }) => {
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const toggleFollow = (userId: string) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const followAll = () => {
    setFollowing(new Set(suggestedCreators.map((c) => c.id)));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: spacing[8] }}>
      <div style={{ textAlign: 'center', marginBottom: spacing[8] }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto',
            marginBottom: spacing[6],
            borderRadius: radii.full,
            backgroundColor: colors.bg.elevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Users size={40} color={colors.brand.primary} />
        </div>
        <h1
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing[3],
          }}
        >
          Follow Creators
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            lineHeight: typography.lineHeight.relaxed,
            marginBottom: spacing[4],
          }}
        >
          Discover amazing creators in your areas of interest
        </p>
        <Button variant="outline" onClick={followAll} size="sm">
          Follow All
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[8] }}>
        {suggestedCreators.map((creator) => {
          const isFollowing = following.has(creator.id);
          return (
            <div
              key={creator.id}
              style={{
                padding: spacing[4],
                borderRadius: radii.lg,
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                display: 'flex',
                gap: spacing[4],
                alignItems: 'center',
              }}
            >
              <Avatar
                src={creator.avatar}
                alt={creator.displayName}
                size="lg"
                fallback={creator.displayName[0]}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                  <span
                    style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                    }}
                  >
                    {creator.displayName}
                  </span>
                  {creator.isVerified && (
                    <Badge variant="success" size="sm">
                      ✓
                    </Badge>
                  )}
                </div>
                <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing[1] }}>
                  @{creator.username}
                </p>
                <p
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {creator.bio}
                </p>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[1] }}>
                  {formatNumber(creator.followers)} followers
                </p>
              </div>
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => toggleFollow(creator.id)}
                leftIcon={!isFollowing ? <UserPlus size={16} /> : undefined}
                style={{ minWidth: '100px' }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'center' }}>
        <Button variant="outline" onClick={onSkip} size="lg">
          Skip
        </Button>
        <Button onClick={onNext} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
};
