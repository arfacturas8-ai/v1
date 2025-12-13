/**
 * CRYB Design System - Post Card Component
 * Social platform post component with media, reactions, and sharing
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Eye,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flag,
  Copy,
  Download
} from 'lucide-react';
import { Button, IconButton } from '../ui/button';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Collapsible from '@radix-ui/react-collapsible';
// ===== POST CARD VARIANTS =====
const postCardVariants = cva([
  'bg-card border border-border rounded-lg overflow-hidden',
  'transition-all duration-200',
], {
  variants: {
    variant: {
      default: 'shadow-sm hover:shadow-md',
      elevated: 'shadow-md hover:shadow-lg',
      minimal: 'border-0 bg-transparent shadow-none',
      highlighted: 'ring-2 ring-cryb-primary/20 shadow-md',
    },
    size: {
      compact: '',
      default: '',
      expanded: '',
    },
    interactive: {
      true: 'cursor-pointer hover:bg-accent/5',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    interactive: false,
  },
});

// ===== POST INTERFACES =====
export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  role?: string;
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video' | 'gif' | 'audio';
  url: string;
  thumbnail?: string;
  alt?: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
}

export interface PostReactions {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  userLiked?: boolean;
  userBookmarked?: boolean;
}

export interface PostData {
  id: string;
  author: PostAuthor;
  content: string;
  media?: PostMedia[];
  reactions: PostReactions;
  timestamp: Date;
  edited?: Date;
  location?: string;
  tags?: string[];
  mentions?: string[];
  community?: {
    id: string;
    name: string;
    avatar?: string;
  };
  parentPost?: string; // For reposts/quotes
  replyingTo?: string; // For replies
  pinned?: boolean;
  nsfw?: boolean;
  spoiler?: boolean;
}

export interface PostCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Post data */
  post: PostData;
  /** Card variant */
  variant?: VariantProps<typeof postCardVariants>['variant'];
  /** Card size */
  size?: VariantProps<typeof postCardVariants>['size'];
  /** Whether card is interactive */
  interactive?: boolean;
  /** Show full content (vs truncated) */
  expanded?: boolean;
  /** Show media */
  showMedia?: boolean;
  /** Show reactions */
  showReactions?: boolean;
  /** Show timestamp */
  showTimestamp?: boolean;
  /** Show options menu */
  showOptions?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Click handlers */
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onUserClick?: (user: PostAuthor) => void;
  onPostClick?: () => void;
  onCommunityClick?: (community: NonNullable<PostData['community']>) => void;
}

// ===== AVATAR COMPONENT =====
const Avatar: React.FC<{ 
  src?: string; 
  alt: string; 
  size?: 'sm' | 'default' | 'lg';
  verified?: boolean;
  onClick?: () => void;
}> = ({ src, alt, size = 'default', verified, onClick }) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    default: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  return (
    <div style={{
  position: 'relative'
}}>
      <button
        onClick={onClick}
        className={cn(
          'rounded-full bg-muted flex items-center justify-center font-medium',
          'hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring',
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
      {verified && (
        <div style={{
  position: 'absolute',
  borderRadius: '50%'
}}>
          <svg style={{
  color: '#ffffff'
}} viewBox="0 0 20 20">
            <path d="M6.267 9.267L8.267 11.267L13.733 5.8L15.133 7.2L8.267 14.067L4.867 10.667L6.267 9.267Z" />
          </svg>
        </div>
      )}
    </div>
  );
};

// ===== MEDIA GALLERY COMPONENT =====
const MediaGallery: React.FC<{ media: PostMedia[]; compact?: boolean }> = ({ 
  media, 
  compact = false 
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];
  const hasMultiple = media.length > 1;

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const renderMedia = (mediaItem: PostMedia, isPreview = false) => {
    const aspectRatio = mediaItem.width && mediaItem.height 
      ? `${mediaItem.width}/${mediaItem.height}` 
      : '16/9';

    switch (mediaItem.type) {
      case 'image':
      case 'gif':
        return (
          <div 
            style={{
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden'
}}
            style={{ aspectRatio }}
          >
            <img
              src={mediaItem.url}
              alt={mediaItem.alt || 'Post media'}
              style={{
  width: '100%',
  height: '100%'
}}
              loading="lazy"
            />
            {mediaItem.type === 'gif' && (
              <div style={{
  position: 'absolute',
  color: '#ffffff',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                GIF
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div 
            style={{
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden'
}}
            style={{ aspectRatio }}
          >
            <video
              ref={videoRef}
              src={mediaItem.url}
              poster={mediaItem.thumbnail}
              style={{
  width: '100%',
  height: '100%'
}}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
            
            {/* Video Controls */}
            <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              <IconButton
                icon={isPlaying ? <Pause /> : <Play />}
                variant="glass"
                size="icon-lg"
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              />
            </div>

            {/* Video Info */}
            <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <IconButton
                icon={isMuted ? <VolumeX /> : <Volume2 />}
                variant="ghost"
                size="icon-sm"
                onClick={handleMuteToggle}
                style={{
  color: '#ffffff'
}}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              />
              {mediaItem.duration && (
                <span style={{
  color: '#ffffff',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                  {formatDuration(mediaItem.duration)}
                </span>
              )}
            </div>
          </div>
        );

      case 'audio':
        return (
          <div style={{
  borderRadius: '12px',
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
            <IconButton
              icon={isPlaying ? <Pause /> : <Play />}
              variant="primary"
              size="icon"
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            />
            <div style={{
  flex: '1'
}}>
              <div style={{
  fontWeight: '500'
}}>Audio File</div>
              {mediaItem.duration && (
                <div className="text-xs text-muted-foreground">
                  {formatDuration(mediaItem.duration)}
                </div>
              )}
            </div>
            <IconButton
              icon={isMuted ? <VolumeX /> : <Volume2 />}
              variant="ghost"
              size="icon-sm"
              onClick={handleMuteToggle}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (compact && hasMultiple) {
    // Compact grid view for multiple media
    return (
      <div style={{
  display: 'grid',
  gap: '8px',
  borderRadius: '12px',
  overflow: 'hidden'
}}>
        {media.slice(0, 4).map((mediaItem, index) => (
          <div key={mediaItem.id} style={{
  position: 'relative'
}}>
            {renderMedia(mediaItem, true)}
            {index === 3 && media.length > 4 && (
              <div style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <span style={{
  color: '#ffffff',
  fontWeight: '500'
}}>+{media.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
  position: 'relative'
}}>
      {renderMedia(currentMedia)}
      
      {hasMultiple && (
        <>
          {/* Navigation */}
          {currentIndex > 0 && (
            <IconButton
              icon={<ChevronUp />}
              variant="glass"
              size="icon-sm"
              style={{
  position: 'absolute'
}}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              aria-label="Previous media"
            />
          )}
          {currentIndex < media.length - 1 && (
            <IconButton
              icon={<ChevronDown />}
              variant="glass"
              size="icon-sm"
              style={{
  position: 'absolute'
}}
              onClick={() => setCurrentIndex(currentIndex + 1)}
              aria-label="Next media"
            />
          )}
          
          {/* Indicators */}
          <div style={{
  position: 'absolute',
  display: 'flex',
  gap: '4px'
}}>
            {media.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                )}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to media ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ===== REACTION BAR COMPONENT =====
const ReactionBar: React.FC<{
  reactions: PostReactions;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  compact?: boolean;
}> = ({ reactions, onLike, onComment, onShare, onBookmark, compact = false }) => {
  return (
    <div className={cn('flex items-center justify-between', compact ? 'gap-2' : 'gap-4')}>
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
        {/* Like Button */}
        <Button
          variant="ghost"
          size={compact ? 'sm' : 'default'}
          className={cn(
            'gap-2',
            reactions.userLiked && 'text-red-500 hover:text-red-600'
          )}
          onClick={onLike}
        >
          <Heart className={cn('h-4 w-4', reactions.userLiked && 'fill-current')} />
          {!compact && (
            <span className="text-sm">{formatNumber(reactions.likes)}</span>
          )}
        </Button>

        {/* Comment Button */}
        <Button
          variant="ghost"
          size={compact ? 'sm' : 'default'}
          style={{
  gap: '8px'
}}
          onClick={onComment}
        >
          <MessageCircle style={{
  height: '16px',
  width: '16px'
}} />
          {!compact && (
            <span className="text-sm">{formatNumber(reactions.comments)}</span>
          )}
        </Button>

        {/* Share Button */}
        <Button
          variant="ghost"
          size={compact ? 'sm' : 'default'}
          style={{
  gap: '8px'
}}
          onClick={onShare}
        >
          <Share2 style={{
  height: '16px',
  width: '16px'
}} />
          {!compact && reactions.shares > 0 && (
            <span className="text-sm">{formatNumber(reactions.shares)}</span>
          )}
        </Button>
      </div>

      {/* Bookmark Button */}
      <Button
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        className={cn(
          reactions.userBookmarked && 'text-cryb-primary hover:text-cryb-primary/80'
        )}
        onClick={onBookmark}
      >
        <Bookmark className={cn('h-4 w-4', reactions.userBookmarked && 'fill-current')} />
      </Button>
    </div>
  );
};

// ===== POST OPTIONS MENU =====
const PostOptionsMenu: React.FC<{ post: PostData }> = ({ post }) => {
  const menuItems = [
    { icon: <Copy />, label: 'Copy link', action: () => {} },
    { icon: <ExternalLink />, label: 'Open in new tab', action: () => {} },
    { icon: <Download />, label: 'Save post', action: () => {} },
    { icon: <Flag />, label: 'Report post', action: () => {} },
  ];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton
          icon={<MoreHorizontal />}
          variant="ghost"
          size="icon-sm"
          aria-label="Post options"
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
          {menuItems.map((item, index) => (
            <DropdownMenu.Item
              key={index}
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}
              onClick={item.action}
            >
              <span style={{
  width: '16px',
  height: '16px'
}}>{item.icon}</span>
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

// ===== MAIN POST CARD COMPONENT =====
const PostCard = React.forwardRef<HTMLDivElement, PostCardProps>(
  (
    {
      className,
      post,
      variant,
      size,
      interactive = false,
      expanded = false,
      showMedia = true,
      showReactions = true,
      showTimestamp = true,
      showOptions = true,
      compact = false,
      onLike,
      onComment,
      onShare,
      onBookmark,
      onUserClick,
      onPostClick,
      onCommunityClick,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(expanded);
    const [showSpoiler, setShowSpoiler] = React.useState(!post.spoiler);

    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking on interactive elements
      if ((e.target as HTMLElement).closest('button, a')) return;
      onPostClick?.();
    };

    const shouldTruncate = post.content.length > 280 && !isExpanded;
    const displayContent = shouldTruncate 
      ? post.content.slice(0, 280) + '...' 
      : post.content;

    return (
      <div
        ref={ref}
        className={cn(postCardVariants({ variant, size, interactive }), className)}
        onClick={interactive ? handleCardClick : undefined}
        {...props}
      >
        <div className={cn('p-4', compact && 'p-3')}>
          {/* Header */}
          <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  flex: '1'
}}>
              {/* Avatar */}
              <Avatar
                src={post.author.avatar}
                alt={post.author.name}
                size={compact ? 'sm' : 'default'}
                verified={post.author.verified}
                onClick={() => onUserClick?.(post.author)}
              />

              {/* Author Info */}
              <div style={{
  flex: '1'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
}}>
                  <button
                    onClick={() => onUserClick?.(post.author)}
                    style={{
  fontWeight: '600'
}}
                  >
                    {post.author.name}
                  </button>
                  
                  <span className="text-muted-foreground text-sm">@{post.author.username}</span>
                  
                  {post.author.role && (
                    <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%'
}}>
                      {post.author.role}
                    </span>
                  )}
                  
                  {showTimestamp && (
                    <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <Clock style={{
  height: '12px',
  width: '12px'
}} />
                      {formatRelativeTime(post.timestamp)}
                    </span>
                  )}
                </div>

                {/* Community */}
                {post.community && (
                  <button
                    onClick={() => onCommunityClick?.(post.community!)}
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}
                  >
                    <Users style={{
  height: '12px',
  width: '12px'
}} />
                    {post.community.name}
                  </button>
                )}

                {/* Location */}
                {post.location && (
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                    <MapPin style={{
  height: '12px',
  width: '12px'
}} />
                    {post.location}
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            {showOptions && <PostOptionsMenu post={post} />}
          </div>

          {/* Content */}
          <div className="mb-3">
            {post.spoiler && !showSpoiler ? (
              <div style={{
  borderRadius: '12px',
  padding: '16px',
  textAlign: 'center'
}}>
                <p className="text-sm text-muted-foreground mb-2">
                  This post contains spoilers
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowSpoiler(true)}
                >
                  Show Content
                </Button>
              </div>
            ) : (
              <>
                <div className="text-sm whitespace-pre-wrap break-words">
                  {displayContent}
                </div>
                
                {shouldTruncate && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-cryb-primary text-sm hover:underline mt-1"
                  >
                    Show more
                  </button>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px'
}}>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-cryb-primary text-sm hover:underline cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Media */}
          {showMedia && post.media && post.media.length > 0 && showSpoiler && (
            <div className="mb-3">
              <MediaGallery media={post.media} compact={compact} />
            </div>
          )}

          {/* Reactions */}
          {showReactions && (
            <ReactionBar
              reactions={post.reactions}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onBookmark={onBookmark}
              compact={compact}
            />
          )}

          {/* Pins/Edited Indicator */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              {post.pinned && (
                <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  📌 Pinned
                </span>
              )}
              
              {post.edited && (
                <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  <Eye style={{
  height: '12px',
  width: '12px'
}} />
                  Edited {formatRelativeTime(post.edited)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PostCard.displayName = 'PostCard';

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

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
};

// ===== EXPORTS =====
export { PostCard, Avatar, MediaGallery, ReactionBar };
export type { PostCardProps, PostData, PostAuthor, PostMedia, PostReactions };