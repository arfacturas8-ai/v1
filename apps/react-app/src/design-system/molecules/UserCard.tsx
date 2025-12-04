import React from 'react';
import { colors, radii, spacing, typography } from '../tokens';
import { Avatar, Button, Text } from '../atoms';

interface UserCardProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    isVerified?: boolean;
    followerCount: number;
    followingCount: number;
    isFollowing?: boolean;
  };
  onFollow?: () => void;
  onUnfollow?: () => void;
  onUserClick?: () => void;
  showFollowButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onFollow,
  onUnfollow,
  onUserClick,
  showFollowButton = true,
  className = '',
  style,
}) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: colors['bg-secondary'],
    borderRadius: radii.lg,
    padding: spacing[4],
    border: `1px solid ${colors['border-subtle']}`,
    cursor: onUserClick ? 'pointer' : 'default',
    transition: 'all 150ms ease-out',
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  };

  const userInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const bioStyle: React.CSSProperties = {
    marginBottom: spacing[3],
  };

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
  };

  const statStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[1],
  };

  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.isFollowing) {
      onUnfollow?.();
    } else {
      onFollow?.();
    }
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onClick={onUserClick}
    >
      {/* Header: Avatar + Name + Follow Button */}
      <div style={headerStyle}>
        <Avatar
          src={user.avatar}
          username={user.username}
          size="lg"
          showVerified
          isVerified={user.isVerified}
          onClick={(e) => {
            e?.stopPropagation();
            onUserClick?.();
          }}
        />

        <div style={userInfoStyle}>
          <Text size="lg" weight="semibold" truncate>
            {user.displayName}
          </Text>
          <Text variant="secondary" size="sm" truncate>
            @{user.username}
          </Text>
        </div>

        {showFollowButton && (
          <Button
            variant={user.isFollowing ? 'outline' : 'primary'}
            size="sm"
            onClick={handleFollowClick}
          >
            {user.isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>

      {/* Bio */}
      {user.bio && (
        <div style={bioStyle}>
          <Text size="sm" variant="secondary" numberOfLines={2}>
            {user.bio}
          </Text>
        </div>
      )}

      {/* Stats */}
      <div style={statsStyle}>
        <div style={statStyle}>
          <Text size="sm" weight="semibold">
            {formatCount(user.followingCount)}
          </Text>
          <Text size="sm" variant="secondary">
            Following
          </Text>
        </div>
        <div style={statStyle}>
          <Text size="sm" weight="semibold">
            {formatCount(user.followerCount)}
          </Text>
          <Text size="sm" variant="secondary">
            Followers
          </Text>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
