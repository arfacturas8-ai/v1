/**
 * CRYB Design System - Feed Post Card Component
 * Modern social platform hybrid style post card
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  ExternalLink,
  Pin,
  Clock,
  Eye,
  TrendingUp,
  Image as ImageIcon,
  Play,
  Code,
  Link as LinkIcon,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import { Button, IconButton } from '../ui/button';
import { VoteButtons } from './VoteButtons';
import { AwardDisplay, PostAward } from './AwardSystem';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link } from 'react-router-dom';

export interface FeedPostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  verified?: boolean;
  badges?: string[];
}

export interface FeedPostCommunity {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  color?: string;
}

export interface FeedPostMedia {
  type: 'image' | 'video' | 'gallery' | 'link';
  url: string;
  thumbnail?: string;
  aspectRatio?: string;
  title?: string;
  description?: string;
  domain?: string;
}

export interface FeedPost {
  id: string;
  title: string;
  content?: string;
  author: FeedPostAuthor;
  community?: FeedPostCommunity;
  score: number;
  userVote?: 'up' | 'down' | null;
  commentCount: number;
  awards: PostAward[];
  createdAt: Date;
  edited?: Date;
  pinned?: boolean;
  locked?: boolean;
  nsfw?: boolean;
  spoiler?: boolean;
  media?: FeedPostMedia;
  flair?: {
    text: string;
    color: string;
  };
  userBookmarked?: boolean;
  viewCount?: number;
}

export interface FeedPostCardProps {
  post: FeedPost;
  variant?: 'default' | 'compact' | 'detailed';
  onVote?: (postId: string, voteType: 'up' | 'down' | null) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onAward?: (postId: string, awardId: string) => void;
  onClick?: (postId: string) => void;
  showCommunity?: boolean;
  showMedia?: boolean;
  className?: string;
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  post,
  variant = 'default',
  onVote,
  onComment,
  onShare,
  onBookmark,
  onAward,
  onClick,
  showCommunity = true,
  showMedia = true,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleVote = (voteType: 'up' | 'down' | null) => {
    onVote?.(post.id, voteType);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a')) return;
    onClick?.(post.id);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPostTypeIcon = () => {
    if (!post.media) return null;

    switch (post.media.type) {
      case 'image':
      case 'gallery':
        return <ImageIcon style={{
  width: '16px',
  height: '16px'
}} />;
      case 'video':
        return <Play style={{
  width: '16px',
  height: '16px'
}} />;
      case 'link':
        return <LinkIcon style={{
  width: '16px',
  height: '16px'
}} />;
      default:
        return null;
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
    >
      <Card
        variant="default"
        hover="lift"
        className={cn(
          'overflow-hidden transition-all duration-200 cursor-pointer',
          isHovered && 'shadow-lg border-border/80',
          post.pinned && 'ring-2 ring-primary/20'
        )}
        onClick={handleCardClick}
      >
        <div style={{
  display: 'flex',
  gap: 'var(--space-3)',
  padding: 'var(--space-3)'
}}>
          {/* Voting Sidebar */}
          <div className="flex-shrink-0">
            <VoteButtons
              score={post.score}
              userVote={post.userVote}
              onVote={handleVote}
              orientation="vertical"
              size={isCompact ? 'sm' : 'default'}
              showTrending
              trendingThreshold={100}
            />
          </div>

          {/* Main Content */}
          <div style={{
  flex: '1'
}}>
            {/* Header */}
            <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-2)'
}}>
              <div style={{
  flex: '1'
}}>
                {/* Community & Author */}
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flexWrap: 'wrap'
}}>
                  {showCommunity && post.community && (
                    <>
                      <Link
                        to={`/c/${post.community.name}`}
                        style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)'
}}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.community.icon && (
                          <img
                            src={post.community.icon}
                            alt={post.community.displayName}
                            style={{
  width: 'var(--icon-sm)',
  height: 'var(--icon-sm)',
  borderRadius: 'var(--radius-full)'
}}
                          />
                        )}
                        <span>c/{post.community.name}</span>
                      </Link>
                      <span>•</span>
                    </>
                  )}

                  <Link
                    to={`/u/${post.author.username}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    u/{post.author.username}
                  </Link>

                  {post.author.verified && (
                    <span className="text-primary" title="Verified">
                      ✓
                    </span>
                  )}

                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-tertiary)'
}}>
                    <Clock style={{
  width: 'var(--icon-xs)',
  height: 'var(--icon-xs)'
}} />
                    {formatTimeAgo(post.createdAt)}
                  </span>

                  {post.edited && (
                    <span className="italic" title={`Edited ${formatTimeAgo(post.edited)}`}>
                      (edited)
                    </span>
                  )}
                </div>

                {/* Badges */}
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-1)'
}}>
                  {post.pinned && (
                    <span className="badge" style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  backgroundColor: 'var(--color-info-light)',
  color: 'var(--brand-primary)'
}}>
                      <Pin style={{
  width: 'var(--icon-xs)',
  height: 'var(--icon-xs)'
}} />
                      Pinned
                    </span>
                  )}

                  {post.flair && (
                    <span
                      className="badge"
                      style={{
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-medium)',
                        backgroundColor: `${post.flair.color}20`,
                        color: post.flair.color,
                      }}
                    >
                      {post.flair.text}
                    </span>
                  )}

                  {post.nsfw && (
                    <span className="badge" style={{
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  backgroundColor: 'var(--color-error-light)',
  color: 'var(--color-error)'
}}>
                      NSFW
                    </span>
                  )}

                  {post.spoiler && (
                    <span className="badge" style={{
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  backgroundColor: 'var(--color-warning-light)',
  color: 'var(--color-warning)'
}}>
                      Spoiler
                    </span>
                  )}

                  {post.locked && (
                    <span className="badge" style={{
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-medium)',
  backgroundColor: 'var(--bg-tertiary)',
  color: 'var(--text-secondary)'
}}>
                      Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Options Menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <IconButton
                    icon={<MoreHorizontal style={{
  width: '16px',
  height: '16px'
}} />}
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More options"
                    onClick={(e) => e.stopPropagation()}
                  />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="card"
                    style={{
  width: '224px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-1)',
  boxShadow: 'var(--shadow-lg)'
}}
                    align="end"
                  >
                    <DropdownMenu.Item className="btn-ghost" style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-2) var(--space-3)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  borderRadius: 'var(--radius-md)'
}}>
                      <ExternalLink style={{
  width: '16px',
  height: '16px'
}} />
                      Open in new tab
                    </DropdownMenu.Item>
                    <DropdownMenu.Item style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
                      <Share2 style={{
  width: '16px',
  height: '16px'
}} />
                      Copy link
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator style={{
  marginTop: '4px',
  marginBottom: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}} />
                    <DropdownMenu.Item style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
                      Report
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>

            {/* Title */}
            <h3
              className={cn(
                'font-semibold mb-2 leading-snug',
                isCompact ? 'text-base' : 'text-lg',
                'hover:text-primary transition-colors'
              )}
            >
              <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}>
                {getPostTypeIcon() && (
                  <span className="text-muted-foreground mt-1 flex-shrink-0">
                    {getPostTypeIcon()}
                  </span>
                )}
                <span>{post.title}</span>
              </div>
            </h3>

            {/* Content Preview */}
            {!isCompact && post.content && (
              <div className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {post.content}
              </div>
            )}

            {/* Media */}
            {showMedia && post.media && !isCompact && (
              <div style={{
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  marginBottom: 'var(--space-3)'
}}>
                {post.media.type === 'image' && (
                  <img
                    src={post.media.url}
                    alt={post.title}
                    style={{
  width: '100%',
  display: 'block'
}}
                    onLoad={() => setImageLoaded(true)}
                  />
                )}

                {post.media.type === 'link' && (
                  <a
                    href={post.media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="card"
                    style={{
  display: 'block',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-3)',
  transition: 'all var(--transition-normal)'
}}
                  >
                    <div style={{
  display: 'flex',
  gap: 'var(--space-3)'
}}>
                      {post.media.thumbnail && (
                        <img
                          src={post.media.thumbnail}
                          alt=""
                          style={{
  width: '96px',
  height: '96px',
  borderRadius: '4px'
}}
                        />
                      )}
                      <div style={{
  flex: '1'
}}>
                        <div style={{
  fontWeight: '500'
}}>
                          {post.media.title || post.title}
                        </div>
                        {post.media.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {post.media.description}
                          </div>
                        )}
                        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                          <ExternalLink style={{
  width: '12px',
  height: '12px'
}} />
                          {post.media.domain}
                        </div>
                      </div>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-2)',
  paddingTop: 'var(--space-2)'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)'
}}>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{
  gap: '8px'
}}
                  onClick={(e) => {
                    e.stopPropagation();
                    onComment?.(post.id);
                  }}
                >
                  <MessageSquare style={{
  width: '16px',
  height: '16px'
}} />
                  <span>{formatNumber(post.commentCount)}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  style={{
  gap: '8px'
}}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.(post.id);
                  }}
                >
                  <Share2 style={{
  width: '16px',
  height: '16px'
}} />
                  <span className={isCompact ? 'sr-only' : ''}>Share</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-2',
                    post.userBookmarked
                      ? 'text-primary hover:text-primary/80'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark?.(post.id);
                  }}
                >
                  <Bookmark
                    className={cn('w-4 h-4', post.userBookmarked && 'fill-current')}
                  />
                  <span className={isCompact ? 'sr-only' : ''}>Save</span>
                </Button>
              </div>

              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                {/* Awards */}
                {post.awards.length > 0 && (
                  <AwardDisplay
                    awards={post.awards}
                    showAwardButton={!isCompact}
                    onAward={(awardId) => onAward?.(post.id, awardId)}
                    maxDisplay={3}
                    size="sm"
                    userCoins={500}
                  />
                )}

                {/* View Count */}
                {post.viewCount && post.viewCount > 0 && (
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                    <Eye style={{
  width: '12px',
  height: '12px'
}} />
                    {formatNumber(post.viewCount)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

FeedPostCard.displayName = 'FeedPostCard';
