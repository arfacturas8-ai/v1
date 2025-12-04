import React from 'react';
import {
  Heart,
  MessageCircle,
  Repeat,
  UserPlus,
  Tag,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { colors, spacing, typography, radii } from '../tokens';

type NotificationType =
  | 'follow'
  | 'like'
  | 'comment'
  | 'mention'
  | 'repost'
  | 'quote'
  | 'nft_sold'
  | 'offer_received'
  | 'offer_accepted'
  | 'bid_placed'
  | 'auction_won'
  | 'auction_lost'
  | 'community_invite'
  | 'community_post'
  | 'system';

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  actors: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  content?: string;
  previewImage?: string;
  timestamp: Date;
  isRead?: boolean;
  onClick?: () => void;
  onMarkAsRead?: () => void;
}

const notificationConfig: Record<
  NotificationType,
  {
    icon: React.ReactNode;
    color: string;
    getText: (actors: string[], content?: string) => string;
  }
> = {
  follow: {
    icon: <UserPlus size={20} />,
    color: colors.brand.primary,
    getText: (actors) => {
      if (actors.length === 1) return `${actors[0]} followed you`;
      if (actors.length === 2) return `${actors[0]} and ${actors[1]} followed you`;
      return `${actors[0]} and ${actors.length - 1} others followed you`;
    },
  },
  like: {
    icon: <Heart size={20} />,
    color: colors.semantic.error,
    getText: (actors) => {
      if (actors.length === 1) return `${actors[0]} liked your post`;
      if (actors.length === 2) return `${actors[0]} and ${actors[1]} liked your post`;
      return `${actors[0]} and ${actors.length - 1} others liked your post`;
    },
  },
  comment: {
    icon: <MessageCircle size={20} />,
    color: colors.brand.primary,
    getText: (actors, content) => `${actors[0]} commented: ${content || ''}`,
  },
  mention: {
    icon: <Tag size={20} />,
    color: colors.brand.primary,
    getText: (actors, content) => `${actors[0]} mentioned you in a post`,
  },
  repost: {
    icon: <Repeat size={20} />,
    color: colors.semantic.success,
    getText: (actors) => {
      if (actors.length === 1) return `${actors[0]} reposted your post`;
      return `${actors[0]} and ${actors.length - 1} others reposted your post`;
    },
  },
  quote: {
    icon: <MessageCircle size={20} />,
    color: colors.brand.primary,
    getText: (actors) => `${actors[0]} quoted your post`,
  },
  nft_sold: {
    icon: <ShoppingCart size={20} />,
    color: colors.semantic.success,
    getText: (actors, content) => `Your NFT was sold for ${content}`,
  },
  offer_received: {
    icon: <DollarSign size={20} />,
    color: colors.brand.primary,
    getText: (actors, content) => `${actors[0]} made an offer of ${content}`,
  },
  offer_accepted: {
    icon: <ShoppingCart size={20} />,
    color: colors.semantic.success,
    getText: (actors, content) => `${actors[0]} accepted your offer`,
  },
  bid_placed: {
    icon: <TrendingUp size={20} />,
    color: colors.brand.primary,
    getText: (actors, content) => `${actors[0]} placed a bid of ${content}`,
  },
  auction_won: {
    icon: <ShoppingCart size={20} />,
    color: colors.semantic.success,
    getText: (actors, content) => `You won the auction for ${content}`,
  },
  auction_lost: {
    icon: <AlertCircle size={20} />,
    color: colors.semantic.warning,
    getText: (actors, content) => `You were outbid on ${content}`,
  },
  community_invite: {
    icon: <Users size={20} />,
    color: colors.brand.primary,
    getText: (actors, content) => `${actors[0]} invited you to join ${content}`,
  },
  community_post: {
    icon: <Bell size={20} />,
    color: colors.brand.primary,
    getText: (actors, content) => `New post in ${content}`,
  },
  system: {
    icon: <Bell size={20} />,
    color: colors.text.secondary,
    getText: (actors, content) => content || 'System notification',
  },
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  actors,
  content,
  previewImage,
  timestamp,
  isRead = false,
  onClick,
  onMarkAsRead,
}) => {
  const config = notificationConfig[type];

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleClick = () => {
    if (!isRead) {
      onMarkAsRead?.();
    }
    onClick?.();
  };

  const renderActorAvatars = () => {
    const visibleActors = actors.slice(0, 3);

    if (visibleActors.length === 1) {
      return <Avatar src={visibleActors[0].avatar} alt={visibleActors[0].name} size="md" fallback={visibleActors[0].name[0]} />;
    }

    return (
      <div style={{ position: 'relative', width: '48px', height: '48px' }}>
        {visibleActors.map((actor, index) => (
          <div
            key={actor.id}
            style={{
              position: 'absolute',
              left: index * 12,
              top: index * 8,
              zIndex: visibleActors.length - index,
            }}
          >
            <Avatar
              src={actor.avatar}
              alt={actor.name}
              size="sm"
              fallback={actor.name[0]}
              style={{
                border: `2px solid ${colors.bg.primary}`,
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        gap: spacing[3],
        padding: spacing[4],
        borderRadius: radii.md,
        backgroundColor: isRead ? colors.bg.primary : colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms ease-out',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = colors.bg.hover;
          e.currentTarget.style.borderColor = colors.brand.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = isRead ? colors.bg.primary : colors.bg.secondary;
          e.currentTarget.style.borderColor = colors.border.default;
        }
      }}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div
          style={{
            position: 'absolute',
            left: spacing[2],
            top: '50%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: radii.full,
            backgroundColor: colors.brand.primary,
          }}
        />
      )}

      {/* Actor avatars or icon */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {actors.length > 0 ? (
          renderActorAvatars()
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: radii.full,
              backgroundColor: colors.bg.tertiary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(config.icon as React.ReactElement, { color: config.color })}
          </div>
        )}

        {/* Type icon overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: '24px',
            height: '24px',
            borderRadius: radii.full,
            backgroundColor: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${colors.bg.primary}`,
          }}
        >
          {React.cloneElement(config.icon as React.ReactElement, { size: 12, color: 'white' })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text.primary,
            lineHeight: typography.lineHeight.relaxed,
            marginBottom: spacing[1],
          }}
        >
          {config.getText(actors.map((a) => a.name), content)}
        </p>

        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>{formatTime(timestamp)}</div>
      </div>

      {/* Preview image */}
      {previewImage && (
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: radii.md,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={previewImage}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
    </div>
  );
};
