/**
 * CRYB Design System - Community Card Component
 * Community header and membership components for social platform
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import {
  Users,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  Settings,
  Flag,
  Eye,
  Bell,
  BellOff,
  Share2,
  Calendar,
  MapPin,
  Globe,
  Lock,
  Star,
  TrendingUp,
  Activity,
  MessageSquare
} from 'lucide-react';
import { Button, IconButton } from '../ui/button';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tabs from '@radix-ui/react-tabs';
import { Badge } from '../ui/badge';
// ===== COMMUNITY CARD VARIANTS =====
const communityCardVariants = cva([
  'bg-white border border-[var(--border-subtle)] rounded-lg overflow-hidden',
  'transition-all duration-200',
], {
  variants: {
    variant: {
      default: 'shadow-sm hover:shadow-md',
      compact: 'shadow-sm',
      detailed: 'shadow-md',
      featured: 'ring-2 ring-cryb-primary/20 shadow-lg',
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

// ===== COMMUNITY INTERFACES =====
export interface CommunityMember {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinDate: Date;
  verified?: boolean;
}

export interface CommunityRules {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface CommunityStats {
  members: number;
  posts: number;
  comments: number;
  activeToday: number;
  growth: number; // percentage
  trending?: boolean;
}

export interface Community {
  id: string;
  name: string;
  displayName: string;
  description: string;
  avatar?: string;
  banner?: string;
  category: string;
  tags: string[];
  privacy: 'public' | 'private' | 'restricted';
  nsfw: boolean;
  verified: boolean;
  featured: boolean;
  createdAt: Date;
  stats: CommunityStats;
  rules?: CommunityRules[];
  moderators: CommunityMember[];
  currentUserRole?: CommunityMember['role'];
  userMembership?: {
    isMember: boolean;
    isFollowing: boolean;
    isMuted: boolean;
    notificationsEnabled: boolean;
    joinDate?: Date;
  };
  settings?: {
    allowPosts: boolean;
    requireApproval: boolean;
    allowImages: boolean;
    allowVideos: boolean;
    allowPolls: boolean;
  };
}

export interface CommunityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Community data */
  community: Community;
  /** Current user */
  currentUser?: { id: string; username: string };
  /** Card variant */
  variant?: VariantProps<typeof communityCardVariants>['variant'];
  /** Card size */
  size?: VariantProps<typeof communityCardVariants>['size'];
  /** Show detailed information */
  detailed?: boolean;
  /** Show member actions */
  showActions?: boolean;
  /** Show stats */
  showStats?: boolean;
  /** Show moderators */
  showModerators?: boolean;
  /** Show rules preview */
  showRules?: boolean;
  /** Action handlers */
  onJoin?: () => void;
  onLeave?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
  onNotificationToggle?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onViewCommunity?: () => void;
  onManage?: () => void;
}

// ===== COMMUNITY CATEGORY ICONS =====
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'technology': Code,
    'gaming': Gamepad2,
    'art': Palette,
    'music': Music,
    'photography': Camera,
    'business': Briefcase,
    'education': BookOpen,
    'lifestyle': Coffee,
    'fitness': Target,
    'entertainment': Star,
    'news': Globe,
    'discussion': MessageSquare,
  };
  
  return iconMap[category.toLowerCase()] || Hash;
};

// ===== PRIVACY INDICATOR COMPONENT =====
const PrivacyIndicator: React.FC<{ privacy: Community['privacy']; size?: 'sm' | 'default' }> = ({ 
  privacy, 
  size = 'default' 
}) => {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  const privacyConfig = {
    public: { 
      icon: Globe, 
      label: 'Public', 
      color: 'text-green-600 dark:text-green-400' 
    },
    private: { 
      icon: Lock, 
      label: 'Private', 
      color: 'text-red-600 dark:text-red-400' 
    },
    restricted: { 
      icon: Shield, 
      label: 'Restricted', 
      color: 'text-yellow-600 dark:text-yellow-400' 
    },
  };

  const config = privacyConfig[privacy];
  const IconComponent = config.icon;

  return (
    <div className={cn('flex items-center gap-1', config.color)}>
      <IconComponent className={iconSize} />
      <span className={cn('font-medium', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {config.label}
      </span>
    </div>
  );
};

// ===== MEMBER ROLE BADGE =====
const MemberRoleBadge: React.FC<{ role: CommunityMember['role'] }> = ({ role }) => {
  const roleConfig = {
    owner: {
      icon: Crown,
      label: 'Owner',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    },
    admin: {
      icon: Shield,
      label: 'Admin',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    },
    moderator: {
      icon: Shield,
      label: 'Mod',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    },
    member: {
      icon: Users,
      label: 'Member',
      className: 'bg-gray-100 text-gray-800',
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

// ===== COMMUNITY STATS COMPONENT =====
const CommunityStats: React.FC<{ stats: Community['stats']; compact?: boolean }> = ({ 
  stats, 
  compact = false 
}) => {
  const statItems = [
    { 
      label: 'Members', 
      value: stats.members, 
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400'
    },
    { 
      label: 'Posts', 
      value: stats.posts, 
      icon: Activity,
      color: 'text-green-600 dark:text-green-400'
    },
    { 
      label: 'Comments', 
      value: stats.comments, 
      icon: MessageSquare,
      color: 'text-purple-600 dark:text-purple-400'
    },
    { 
      label: 'Active', 
      value: stats.activeToday, 
      icon: Zap,
      color: 'text-orange-600 dark:text-orange-400'
    },
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
            <IconComponent className={cn('h-4 w-4', stat.color)} />
            <div>
              <div style={{
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                {formatNumber(stat.value)}
                {stat.label === 'Members' && stats.growth > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    +{stats.growth}%
                  </span>
                )}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ===== MODERATOR LIST COMPONENT =====
const ModeratorList: React.FC<{ 
  moderators: CommunityMember[]; 
  limit?: number;
  onMemberClick?: (member: CommunityMember) => void;
}> = ({ moderators, limit = 3, onMemberClick }) => {
  const displayModerators = moderators.slice(0, limit);
  const remainingCount = moderators.length - limit;

  if (moderators.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>Moderators</h4>
      <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
        {displayModerators.map((moderator) => (
          <button
            key={moderator.id}
            onClick={() => onMemberClick?.(moderator)}
            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '12px',
  padding: '8px'
}}
          >
            <div style={{
  height: '24px',
  width: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '500',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)'
}}>
              {moderator.avatar ? (
                <img
                  src={moderator.avatar}
                  alt={moderator.displayName}
                  style={{
  height: '24px',
  width: '24px',
  borderRadius: '50%'
}}
                />
              ) : (
                moderator.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{
  textAlign: 'left'
}}>
              <div style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>
                {moderator.displayName}
              </div>
              <MemberRoleBadge role={moderator.role} />
            </div>
          </button>
        ))}
        {remainingCount > 0 && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  padding: '8px',
  color: 'var(--text-secondary)'
}}>
            +{remainingCount} more
          </div>
        )}
      </div>
    </div>
  );
};

// ===== COMMUNITY ACTIONS COMPONENT =====
const CommunityActions: React.FC<{
  community: Community;
  currentUser?: { id: string; username: string };
  onJoin?: () => void;
  onLeave?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
  onNotificationToggle?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  onManage?: () => void;
}> = ({ 
  community, 
  currentUser, 
  onJoin, 
  onLeave, 
  onFollow, 
  onUnfollow,
  onMute,
  onUnmute,
  onNotificationToggle,
  onShare, 
  onReport, 
  onManage 
}) => {
  const membership = community.userMembership;
  const canManage = community.currentUserRole && ['owner', 'admin'].includes(community.currentUserRole);

  if (!currentUser) {
    return (
      <div style={{
  display: 'flex',
  gap: '8px'
}}>
        <Button onClick={onJoin} style={{
  flex: '1'
}}>
          <UserPlus style={{
  height: '16px',
  width: '16px'
}} />
          Join Community
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Primary Actions */}
      <div style={{
  display: 'flex',
  gap: '8px'
}}>
        {membership?.isMember ? (
          <Button variant="outline" onClick={onLeave} style={{
  flex: '1'
}}>
            <UserMinus style={{
  height: '16px',
  width: '16px'
}} />
            Leave
          </Button>
        ) : (
          <Button onClick={onJoin} style={{
  flex: '1'
}}>
            <UserPlus style={{
  height: '16px',
  width: '16px'
}} />
            Join
          </Button>
        )}

        {/* Manage Button for Admins */}
        {canManage && (
          <Button variant="outline" onClick={onManage}>
            <Settings style={{
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
  border: '1px solid var(--border-subtle)',
  padding: '4px',
  background: 'white'
}}
              align="end"
            >
              {/* Follow/Unfollow */}
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
                onClick={membership?.isFollowing ? onUnfollow : onFollow}
              >
                {membership?.isFollowing ? <UserMinus style={{
  height: '16px',
  width: '16px'
}} /> : <UserPlus style={{
  height: '16px',
  width: '16px'
}} />}
                {membership?.isFollowing ? 'Unfollow' : 'Follow'}
              </DropdownMenu.Item>

              {/* Notifications */}
              {membership?.isMember && (
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
                  onClick={onNotificationToggle}
                >
                  {membership.notificationsEnabled ? 
                    <BellOff style={{
  height: '16px',
  width: '16px'
}} /> : 
                    <Bell style={{
  height: '16px',
  width: '16px'
}} />
                  }
                  {membership.notificationsEnabled ? 'Mute notifications' : 'Enable notifications'}
                </DropdownMenu.Item>
              )}

              {/* Mute/Unmute */}
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
                onClick={membership?.isMuted ? onUnmute : onMute}
              >
                {membership?.isMuted ? <Eye style={{
  height: '16px',
  width: '16px'
}} /> : <EyeOff style={{
  height: '16px',
  width: '16px'
}} />}
                {membership?.isMuted ? 'Unmute community' : 'Mute community'}
              </DropdownMenu.Item>

              <DropdownMenu.Separator style={{
  border: '1px solid var(--border-subtle)',
  marginTop: '4px',
  marginBottom: '4px'
}} />

              {/* Share */}
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
                onClick={onShare}
              >
                <Share2 style={{
  height: '16px',
  width: '16px'
}} />
                Share community
              </DropdownMenu.Item>

              {/* Report */}
              {!canManage && (
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
                  Report community
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Secondary Actions */}
      {membership?.isMember && (
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--text-secondary)'
}}>
          <span>Joined {membership.joinDate?.toLocaleDateString()}</span>
          {membership.notificationsEnabled && (
            <Badge variant="secondary" style={{
  height: '20px'
}}>
              <Bell style={{
  height: '12px',
  width: '12px'
}} />
              Notifications
            </Badge>
          )}
          {membership.isMuted && (
            <Badge variant="secondary" style={{
  height: '20px'
}}>
              <EyeOff style={{
  height: '12px',
  width: '12px'
}} />
              Muted
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

// ===== MAIN COMMUNITY CARD COMPONENT =====
const CommunityCard = React.forwardRef<HTMLDivElement, CommunityCardProps>(
  (
    {
      className,
      community,
      currentUser,
      variant,
      size,
      detailed = false,
      showActions = true,
      showStats = true,
      showModerators = false,
      showRules = false,
      onJoin,
      onLeave,
      onFollow,
      onUnfollow,
      onMute,
      onUnmute,
      onNotificationToggle,
      onShare,
      onReport,
      onViewCommunity,
      onManage,
      ...props
    },
    ref
  ) => {
    const CategoryIcon = getCategoryIcon(community.category);

    return (
      <div
        ref={ref}
        className={cn(
          communityCardVariants({
            variant: community.featured ? 'featured' : variant,
            size
          }),
          className
        )}
        {...props}
      >
        {/* Banner */}
        {community.banner && (
          <div style={{
  height: '96px',
  overflow: 'hidden'
}}>
            <img
              src={community.banner}
              alt={`${community.displayName} banner`}
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
            <div className={cn('relative', community.banner && '-mt-8')}>
              <button
                onClick={onViewCommunity}
                style={{
  height: '64px',
  width: '64px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)'
}}
              >
                {community.avatar ? (
                  <img 
                    src={community.avatar} 
                    alt={community.displayName}
                    style={{
  height: '64px',
  width: '64px',
  borderRadius: '12px'
}} 
                  />
                ) : (
                  <CategoryIcon style={{
  height: '32px',
  width: '32px'
}} />
                )}
              </button>
              
              {/* Verified Badge */}
              {community.verified && (
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
            </div>

            <div style={{
  flex: '1'
}}>
              <div className="space-y-2">
                <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
                  <div>
                    <h3
                      style={{
  fontWeight: 'bold',
  color: 'var(--text-primary)'
}}
                      onClick={onViewCommunity}
                    >
                      {community.displayName}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>r/{community.name}</p>
                  </div>
                  
                  {community.stats.trending && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                      <TrendingUp style={{
  height: '12px',
  width: '12px'
}} />
                      Trending
                    </Badge>
                  )}
                </div>

                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
}}>
                  <PrivacyIndicator privacy={community.privacy} size="sm" />
                  
                  <Badge variant="outline" style={{
  height: '20px'
}}>
                    <CategoryIcon style={{
  height: '12px',
  width: '12px'
}} />
                    {community.category}
                  </Badge>
                  
                  {community.nsfw && (
                    <Badge variant="destructive" style={{
  height: '20px'
}}>
                      NSFW
                    </Badge>
                  )}
                  
                  {community.featured && (
                    <Badge variant="secondary" style={{
  height: '20px'
}}>
                      <Star style={{
  height: '12px',
  width: '12px'
}} />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
              {community.description}
            </p>
          </div>

          {/* Tags */}
          {community.tags.length > 0 && (
            <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px'
}}>
              {community.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" style={{
  height: '20px'
}}>
                  #{tag}
                </Badge>
              ))}
              {community.tags.length > 4 && (
                <Badge variant="secondary" style={{
  height: '20px'
}}>
                  +{community.tags.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-2 mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <Calendar style={{
  height: '16px',
  width: '16px'
}} />
              Created {community.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              })}
            </div>
          </div>

          {/* Stats */}
          {showStats && (
            <div className="mb-4">
              <CommunityStats stats={community.stats} compact={!detailed} />
            </div>
          )}

          {/* Moderators */}
          {showModerators && detailed && community.moderators.length > 0 && (
            <div className="mb-4">
              <ModeratorList moderators={community.moderators} />
            </div>
          )}

          {/* Rules Preview */}
          {showRules && detailed && community.rules && community.rules.length > 0 && (
            <div className="mb-4">
              <h4 style={{
  fontWeight: '500',
  color: 'var(--text-primary)'
}}>Community Rules</h4>
              <div className="space-y-1">
                {community.rules.slice(0, 3).map((rule, index) => (
                  <div key={rule.id} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {index + 1}. {rule.title}
                  </div>
                ))}
                {community.rules.length > 3 && (
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    +{community.rules.length - 3} more rules
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <CommunityActions
              community={community}
              currentUser={currentUser}
              onJoin={onJoin}
              onLeave={onLeave}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
              onMute={onMute}
              onUnmute={onUnmute}
              onNotificationToggle={onNotificationToggle}
              onShare={onShare}
              onReport={onReport}
              onManage={onManage}
            />
          )}
        </div>
      </div>
    );
  }
);

CommunityCard.displayName = 'CommunityCard';

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

// ===== EXPORTS =====
export { 
  CommunityCard, 
  PrivacyIndicator, 
  MemberRoleBadge, 
  CommunityStats as CommunityStatsComponent,
  ModeratorList,
  CommunityActions
};

export type { 
  CommunityCardProps, 
  Community, 
  CommunityMember, 
  CommunityStats, 
  CommunityRules 
};