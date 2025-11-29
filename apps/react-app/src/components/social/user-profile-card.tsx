/**
 * CRYB Design System - User Profile Card Component
 * Comprehensive user profile display with social features
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import {
  Users,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Crown,
  Shield,
  Star,
  MessageCircle,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  Mail,
  Globe,
  Settings,
  Flag,
  Eye,
  Award,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Button, IconButton } from '../ui/button';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tabs from '@radix-ui/react-tabs';
import * as BadgeComponent from '@radix-ui/react-accordion';
// ===== PROFILE CARD VARIANTS =====
const profileCardVariants = cva([
  'bg-card border border-border rounded-lg overflow-hidden',
  'transition-all duration-200',
], {
  variants: {
    variant: {
      default: 'shadow-sm hover:shadow-md',
      compact: 'shadow-sm',
      detailed: 'shadow-md',
      modal: 'shadow-xl max-w-2xl',
    },
    size: {
      sm: 'max-w-sm',
      default: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

// ===== PROFILE INTERFACES =====
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate: Date;
  verified?: boolean;
  premium?: boolean;
  role?: 'admin' | 'moderator' | 'member';
  badges?: UserBadge[];
  stats: UserStats;
  social?: SocialLinks;
  preferences?: UserPreferences;
  followers?: number;
  following?: number;
  mutualConnections?: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
  isMuted?: boolean;
  isPrivate?: boolean;
  lastActive?: Date;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
}

export interface UserStats {
  posts: number;
  comments: number;
  likes: number;
  shares: number;
  karma: number;
  reputation: number;
  streak?: number;
  achievements?: number;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  github?: string;
  linkedin?: string;
  discord?: string;
  custom?: { name: string; url: string }[];
}

export interface UserPreferences {
  showEmail?: boolean;
  showLocation?: boolean;
  showLastActive?: boolean;
  allowMessages?: boolean;
  allowFollows?: boolean;
}

export interface UserProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** User profile data */
  profile: UserProfile;
  /** Current user (for relationship context) */
  currentUser?: { id: string; username: string };
  /** Card variant */
  variant?: VariantProps<typeof profileCardVariants>['variant'];
  /** Card size */
  size?: VariantProps<typeof profileCardVariants>['size'];
  /** Show detailed information */
  detailed?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Show stats */
  showStats?: boolean;
  /** Show social links */
  showSocial?: boolean;
  /** Show badges */
  showBadges?: boolean;
  /** Action handlers */
  onFollow?: () => void;
  onUnfollow?: () => void;
  onMessage?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onViewProfile?: () => void;
  onEdit?: () => void;
}

// ===== STATUS INDICATOR COMPONENT =====
const StatusIndicator: React.FC<{ status?: UserProfile['status']; size?: 'sm' | 'default' | 'lg' }> = ({ 
  status = 'offline', 
  size = 'default' 
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    default: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400',
  };

  return (
    <div className={cn(
      'rounded-full border-2 border-background',
      sizeClasses[size],
      statusColors[status]
    )} />
  );
};

// ===== PROFILE AVATAR COMPONENT =====
const ProfileAvatar: React.FC<{
  src?: string;
  alt: string;
  size?: 'sm' | 'default' | 'lg' | 'xl';
  verified?: boolean;
  premium?: boolean;
  status?: UserProfile['status'];
  onClick?: () => void;
}> = ({ src, alt, size = 'default', verified, premium, status, onClick }) => {
  const sizeClasses = {
    sm: 'h-12 w-12 text-lg',
    default: 'h-16 w-16 text-xl',
    lg: 'h-20 w-20 text-2xl',
    xl: 'h-24 w-24 text-3xl',
  };

  return (
    <div style={{
  position: 'relative'
}}>
      <button
        onClick={onClick}
        className={cn(
          'rounded-full bg-muted flex items-center justify-center font-bold',
          'hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring',
          'border-2 border-background',
          premium && 'border-gradient-to-r from-yellow-400 to-yellow-600',
          sizeClasses[size]
        )}
      >
        {src ? (
          <img src={src} alt={alt} style={{
  borderRadius: '50%',
  width: '100%',
  height: '100%'
}} />
        ) : (
          <span className="text-muted-foreground">
            {alt.charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      {/* Status Indicator */}
      {status && status !== 'offline' && (
        <div style={{
  position: 'absolute'
}}>
          <StatusIndicator status={status} size={size === 'xl' ? 'lg' : 'default'} />
        </div>
      )}

      {/* Verification Badge */}
      {verified && (
        <div style={{
  position: 'absolute',
  borderRadius: '50%',
  padding: '4px'
}}>
          <Badge style={{
  height: '12px',
  width: '12px',
  color: '#ffffff'
}} />
        </div>
      )}

      {/* Premium Badge */}
      {premium && (
        <div style={{
  position: 'absolute',
  borderRadius: '50%',
  padding: '4px'
}}>
          <Crown style={{
  height: '12px',
  width: '12px',
  color: '#ffffff'
}} />
        </div>
      )}
    </div>
  );
};

// ===== ROLE BADGE COMPONENT =====
const RoleBadge: React.FC<{ role?: UserProfile['role'] }> = ({ role }) => {
  if (!role || role === 'member') return null;

  const roleConfig = {
    admin: {
      icon: Crown,
      label: 'Admin',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    },
    moderator: {
      icon: Shield,
      label: 'Moderator',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    },
  };

  const config = roleConfig[role];
  const IconComponent = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      config.className
    )}>
      <IconComponent style={{
  height: '12px',
  width: '12px'
}} />
      {config.label}
    </span>
  );
};

// ===== USER BADGES COMPONENT =====
const UserBadges: React.FC<{ badges?: UserBadge[]; limit?: number }> = ({ badges = [], limit = 3 }) => {
  const displayBadges = badges.slice(0, limit);
  const remainingCount = badges.length - limit;

  if (badges.length === 0) return null;

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flexWrap: 'wrap'
}}>
      {displayBadges.map((badge) => (
        <div
          key={badge.id}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            'bg-gradient-to-r text-white',
            badge.rarity === 'legendary' && 'from-purple-500 to-pink-500',
            badge.rarity === 'epic' && 'from-purple-400 to-blue-500',
            badge.rarity === 'rare' && 'from-blue-400 to-cyan-500',
            !badge.rarity && 'from-gray-400 to-gray-500'
          )}
          title={badge.description}
        >
          <span>{badge.icon}</span>
          <span>{badge.name}</span>
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

// ===== PROFILE STATS COMPONENT =====
const ProfileStats: React.FC<{ stats: UserStats; compact?: boolean }> = ({ stats, compact = false }) => {
  const statItems = [
    { label: 'Posts', value: stats.posts, icon: Activity },
    { label: 'Likes', value: stats.likes, icon: Star },
    { label: 'Comments', value: stats.comments, icon: MessageCircle },
    { label: 'Karma', value: stats.karma, icon: TrendingUp },
  ];

  if (compact) {
    return (
      <div style={{
  display: 'flex',
  justifyContent: 'space-around',
  textAlign: 'center'
}}>
        {statItems.slice(0, 3).map((stat) => (
          <div key={stat.label} className="space-y-1">
            <div style={{
  fontWeight: 'bold'
}}>{formatNumber(stat.value)}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
  display: 'grid',
  gap: '16px'
}}>
      {statItems.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div key={stat.label} style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <IconComponent style={{
  height: '16px',
  width: '16px'
}} />
            <div>
              <div style={{
  fontWeight: '500'
}}>{formatNumber(stat.value)}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ===== SOCIAL LINKS COMPONENT =====
const SocialLinks: React.FC<{ social?: SocialLinks }> = ({ social }) => {
  if (!social) return null;

  const socialItems = [
    { key: 'twitter', icon: Twitter, url: social.twitter },
    { key: 'instagram', icon: Instagram, url: social.instagram },
    { key: 'github', icon: Github, url: social.github },
    { key: 'linkedin', icon: LinkIcon, url: social.linkedin },
  ].filter(item => item.url);

  if (socialItems.length === 0) return null;

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
      {socialItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <a
            key={item.key}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
  padding: '8px',
  borderRadius: '12px'
}}
          >
            <IconComponent style={{
  height: '16px',
  width: '16px'
}} />
          </a>
        );
      })}
      {social.custom && social.custom.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
  padding: '8px',
  borderRadius: '12px',
  fontWeight: '500'
}}
          title={link.name}
        >
          <Globe style={{
  height: '16px',
  width: '16px'
}} />
        </a>
      ))}
    </div>
  );
};

// ===== PROFILE ACTIONS COMPONENT =====
const ProfileActions: React.FC<{
  profile: UserProfile;
  currentUser?: { id: string; username: string };
  onFollow?: () => void;
  onUnfollow?: () => void;
  onMessage?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onEdit?: () => void;
}> = ({ profile, currentUser, onFollow, onUnfollow, onMessage, onBlock, onReport, onEdit }) => {
  const isOwnProfile = currentUser?.id === profile.id;
  const canMessage = profile.preferences?.allowMessages !== false;
  const canFollow = profile.preferences?.allowFollows !== false;

  if (isOwnProfile) {
    return (
      <div style={{
  display: 'flex',
  gap: '8px'
}}>
        <Button onClick={onEdit} style={{
  flex: '1'
}}>
          <Settings style={{
  height: '16px',
  width: '16px'
}} />
          Edit Profile
        </Button>
      </div>
    );
  }

  return (
    <div style={{
  display: 'flex',
  gap: '8px'
}}>
      {/* Follow/Unfollow Button */}
      {canFollow && (
        <Button
          variant={profile.isFollowing ? "outline" : "primary"}
          onClick={profile.isFollowing ? onUnfollow : onFollow}
          style={{
  flex: '1'
}}
        >
          {profile.isFollowing ? (
            <>
              <UserMinus style={{
  height: '16px',
  width: '16px'
}} />
              Unfollow
            </>
          ) : (
            <>
              <UserPlus style={{
  height: '16px',
  width: '16px'
}} />
              Follow
            </>
          )}
        </Button>
      )}

      {/* Message Button */}
      {canMessage && (
        <Button variant="outline" onClick={onMessage}>
          <MessageCircle style={{
  height: '16px',
  width: '16px'
}} />
        </Button>
      )}

      {/* Options Menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IconButton
            icon={<MoreHorizontal />}
            variant="outline"
            size="icon"
            aria-label="More options"
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            style={{
  width: '192px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '4px'
}}
            align="end"
          >
            <DropdownMenu.Item
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}
              onClick={onBlock}
            >
              <Block style={{
  height: '16px',
  width: '16px'
}} />
              {profile.isBlocked ? 'Unblock' : 'Block'} User
            </DropdownMenu.Item>
            <DropdownMenu.Item
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}
              onClick={onReport}
            >
              <Flag style={{
  height: '16px',
  width: '16px'
}} />
              Report User
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

// ===== MAIN PROFILE CARD COMPONENT =====
const UserProfileCard = React.forwardRef<HTMLDivElement, UserProfileCardProps>(
  (
    {
      className,
      profile,
      currentUser,
      variant,
      size,
      detailed = false,
      showActions = true,
      showStats = true,
      showSocial = true,
      showBadges = true,
      onFollow,
      onUnfollow,
      onMessage,
      onBlock,
      onReport,
      onViewProfile,
      onEdit,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(profileCardVariants({ variant, size }), className)}
        {...props}
      >
        {/* Banner */}
        {profile.banner && (
          <div style={{
  height: '96px',
  overflow: 'hidden'
}}>
            <img
              src={profile.banner}
              alt={`${profile.displayName}'s banner`}
              style={{
  width: '100%',
  height: '100%'
}}
            />
          </div>
        )}

        <div style={{
  padding: '24px'
}}>
          {/* Header */}
          <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px'
}}>
            <div className={cn(profile.banner && '-mt-8')}>
              <ProfileAvatar
                src={profile.avatar}
                alt={profile.displayName}
                size={detailed ? 'xl' : 'lg'}
                verified={profile.verified}
                premium={profile.premium}
                status={profile.status}
                onClick={onViewProfile}
              />
            </div>

            <div style={{
  flex: '1'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
                <div className="space-y-1">
                  <h3 style={{
  fontWeight: 'bold'
}}>{profile.displayName}</h3>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
}}>
                    <RoleBadge role={profile.role} />
                    {showBadges && <UserBadges badges={profile.badges} />}
                  </div>
                </div>
                
                {/* Last Active */}
                {profile.lastActive && detailed && (
                  <div className="text-xs text-muted-foreground">
                    Active {formatRelativeTime(profile.lastActive)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-4">
              <p className="text-sm whitespace-pre-wrap break-words">{profile.bio}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-2 mb-4 text-sm text-muted-foreground">
            {profile.location && (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <MapPin style={{
  height: '16px',
  width: '16px'
}} />
                {profile.location}
              </div>
            )}
            {profile.website && (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <LinkIcon style={{
  height: '16px',
  width: '16px'
}} />
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cryb-primary hover:underline truncate"
                >
                  {profile.website}
                </a>
              </div>
            )}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <Calendar style={{
  height: '16px',
  width: '16px'
}} />
              Joined {profile.joinDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </div>
          </div>

          {/* Followers/Following */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
            <button
              className="hover:underline"
              onClick={onViewProfile}
            >
              <span style={{
  fontWeight: '500'
}}>{formatNumber(profile.following || 0)}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </button>
            <button
              className="hover:underline"
              onClick={onViewProfile}
            >
              <span style={{
  fontWeight: '500'
}}>{formatNumber(profile.followers || 0)}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </button>
            {profile.mutualConnections && profile.mutualConnections > 0 && (
              <span className="text-muted-foreground">
                {profile.mutualConnections} mutual
              </span>
            )}
          </div>

          {/* Stats */}
          {showStats && detailed && (
            <div className="mb-4">
              <ProfileStats stats={profile.stats} />
            </div>
          )}

          {/* Social Links */}
          {showSocial && profile.social && (
            <div className="mb-4">
              <SocialLinks social={profile.social} />
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <ProfileActions
              profile={profile}
              currentUser={currentUser}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
              onMessage={onMessage}
              onBlock={onBlock}
              onReport={onReport}
              onEdit={onEdit}
            />
          )}
        </div>
      </div>
    );
  }
);

UserProfileCard.displayName = 'UserProfileCard';

// ===== UTILITY FUNCTIONS =====
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// ===== EXPORTS =====
export { 
  UserProfileCard, 
  ProfileAvatar, 
  RoleBadge, 
  UserBadges, 
  ProfileStats, 
  SocialLinks,
  ProfileActions,
  StatusIndicator
};

export type { 
  UserProfileCardProps, 
  UserProfile, 
  UserBadge, 
  UserStats, 
  SocialLinks
};