/**
 * CRYB Design System - Comment System Component
 * Threaded comment system with collapsible nested replies
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Reply, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Edit,
  Trash2,
  Flag,
  Share2,
  Pin,
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button, IconButton } from '../ui/button';
import { Input, Textarea } from '../ui/input';
import { Avatar } from './post-card';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Collapsible from '@radix-ui/react-collapsible';
// ===== COMMENT VARIANTS =====
const commentVariants = cva([
  'group transition-all duration-200',
], {
  variants: {
    variant: {
      default: 'bg-background',
      highlighted: 'bg-cryb-accent/5 border-l-2 border-cryb-primary',
      pinned: 'bg-cryb-accent/10 border border-cryb-primary/20 rounded-lg',
      deleted: 'opacity-60',
    },
    level: {
      0: 'pl-0',
      1: 'pl-8',
      2: 'pl-12',
      3: 'pl-16',
      4: 'pl-20',
      max: 'pl-24',
    },
  },
  defaultVariants: {
    variant: 'default',
    level: 0,
  },
});

// ===== COMMENT INTERFACES =====
export interface CommentAuthor {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  role?: 'admin' | 'moderator' | 'member';
  badges?: string[];
}

export interface CommentReactions {
  likes: number;
  replies: number;
  userLiked?: boolean;
}

export interface CommentData {
  id: string;
  author: CommentAuthor;
  content: string;
  timestamp: Date;
  edited?: Date;
  reactions: CommentReactions;
  parentId?: string;
  replies?: CommentData[];
  pinned?: boolean;
  deleted?: boolean;
  hidden?: boolean;
  award?: {
    type: string;
    count: number;
  };
  mentions?: string[];
  depth?: number;
}

export interface CommentSystemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Comments data */
  comments: CommentData[];
  /** Post ID these comments belong to */
  postId: string;
  /** Current user for permissions */
  currentUser?: CommentAuthor;
  /** Maximum nesting depth */
  maxDepth?: number;
  /** Show reply composer */
  showReplyComposer?: boolean;
  /** Sort order */
  sortBy?: 'newest' | 'oldest' | 'popular' | 'controversial';
  /** Loading state */
  loading?: boolean;
  /** Event handlers */
  onCommentSubmit?: (content: string, parentId?: string) => void;
  onCommentLike?: (commentId: string) => void;
  onCommentEdit?: (commentId: string, content: string) => void;
  onCommentDelete?: (commentId: string) => void;
  onCommentReport?: (commentId: string) => void;
  onCommentPin?: (commentId: string) => void;
  onAuthorClick?: (author: CommentAuthor) => void;
}

// ===== COMMENT COMPOSER COMPONENT =====
interface CommentComposerProps {
  /** Placeholder text */
  placeholder?: string;
  /** Parent comment ID for replies */
  parentId?: string;
  /** Author info */
  author?: CommentAuthor;
  /** Whether composer is expanded */
  expanded?: boolean;
  /** Submit handler */
  onSubmit?: (content: string, parentId?: string) => void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Auto focus */
  autoFocus?: boolean;
}

const CommentComposer = React.forwardRef<HTMLDivElement, CommentComposerProps>(
  ({ 
    placeholder = "Write a comment...", 
    parentId, 
    author, 
    expanded = false,
    onSubmit,
    onCancel,
    autoFocus = false,
    ...props 
  }, ref) => {
    const [content, setContent] = React.useState('');
    const [isExpanded, setIsExpanded] = React.useState(expanded);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      if (autoFocus && isExpanded && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [autoFocus, isExpanded]);

    const handleSubmit = async () => {
      if (!content.trim()) return;
      
      setIsSubmitting(true);
      try {
        await onSubmit?.(content.trim(), parentId);
        setContent('');
        setIsExpanded(false);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
      setContent('');
      setIsExpanded(false);
      onCancel?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    return (
      <div ref={ref} className="space-y-3" {...props}>
        <div style={{
  display: 'flex',
  gap: '12px'
}}>
          {author && (
            <Avatar
              src={author.avatar}
              alt={author.name}
              size="sm"
            />
          )}
          
          <div style={{
  flex: '1'
}}>
            {!isExpanded ? (
              <Input
                placeholder={placeholder}
                onFocus={() => setIsExpanded(true)}
                className="cursor-pointer"
                readOnly
              />
            ) : (
              <Textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px] resize-none"
                autoFocus={autoFocus}
              />
            )}
          </div>
        </div>



          {isExpanded && (
            <div
              style={{
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px'
}}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                loading={isSubmitting}
                loadingText="Posting..."
              >
                {parentId ? 'Reply' : 'Comment'}
              </Button>
            </div>
          )}
        
      </div>
    );
  }
);

CommentComposer.displayName = 'CommentComposer';

// ===== COMMENT OPTIONS MENU =====
const CommentOptionsMenu: React.FC<{ 
  comment: CommentData; 
  currentUser?: CommentAuthor;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onPin?: () => void;
  onHide?: () => void;
}> = ({ comment, currentUser, onEdit, onDelete, onReport, onPin, onHide }) => {
  const isAuthor = currentUser?.id === comment.author.id;
  const isModerator = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  const canEdit = isAuthor && !comment.deleted;
  const canDelete = isAuthor || isModerator;
  const canPin = isModerator;
  const canHide = isModerator;

  const menuItems = [
    canEdit && { icon: <Edit />, label: 'Edit comment', action: onEdit },
    canDelete && { icon: <Trash2 />, label: 'Delete comment', action: onDelete },
    canPin && { 
      icon: <Pin />, 
      label: comment.pinned ? 'Unpin comment' : 'Pin comment', 
      action: onPin 
    },
    canHide && { 
      icon: comment.hidden ? <Eye /> : <EyeOff />, 
      label: comment.hidden ? 'Show comment' : 'Hide comment', 
      action: onHide 
    },
    { icon: <Share2 />, label: 'Share comment', action: () => {} },
    !isAuthor && { icon: <Flag />, label: 'Report comment', action: onReport },
  ].filter(Boolean);

  if (menuItems.length === 0) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton
          icon={<MoreHorizontal />}
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Comment options"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          style={{
  width: '192px',
  border: '1px solid var(--border-subtle)',
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
              onClick={item!.action}
            >
              <span style={{
  width: '16px',
  height: '16px'
}}>{item!.icon}</span>
              {item!.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

// ===== COMMENT COMPONENT =====
interface CommentProps {
  comment: CommentData;
  currentUser?: CommentAuthor;
  maxDepth?: number;
  onCommentSubmit?: (content: string, parentId?: string) => void;
  onCommentLike?: (commentId: string) => void;
  onCommentEdit?: (commentId: string, content: string) => void;
  onCommentDelete?: (commentId: string) => void;
  onCommentReport?: (commentId: string) => void;
  onCommentPin?: (commentId: string) => void;
  onAuthorClick?: (author: CommentAuthor) => void;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  currentUser,
  maxDepth = 4,
  onCommentSubmit,
  onCommentLike,
  onCommentEdit,
  onCommentDelete,
  onCommentReport,
  onCommentPin,
  onAuthorClick,
}) => {
  const [showReplies, setShowReplies] = React.useState(true);
  const [showReplyComposer, setShowReplyComposer] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(comment.content);

  const depth = Math.min(comment.depth || 0, maxDepth);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < maxDepth && !comment.deleted;

  const handleLike = () => {
    onCommentLike?.(comment.id);
  };

  const handleReply = () => {
    setShowReplyComposer(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditSubmit = () => {
    if (editContent.trim() !== comment.content) {
      onCommentEdit?.(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onCommentDelete?.(comment.id);
  };

  const handleReport = () => {
    onCommentReport?.(comment.id);
  };

  const handlePin = () => {
    onCommentPin?.(comment.id);
  };

  const handleReplySubmit = (content: string) => {
    onCommentSubmit?.(content, comment.id);
    setShowReplyComposer(false);
  };

  if (comment.hidden && currentUser?.role !== 'moderator') {
    return null;
  }

  return (
    <div
      className={cn(commentVariants({
        variant: comment.pinned ? 'pinned' : comment.deleted ? 'deleted' : 'default',
        level: depth as any
      }))}
    >
      <div style={{
  paddingTop: '12px',
  paddingBottom: '12px'
}}>
        {/* Comment Header */}
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
          <Avatar
            src={comment.author.avatar}
            alt={comment.author.name}
            size="sm"
            verified={comment.author.verified}
            onClick={() => onAuthorClick?.(comment.author)}
          />

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
                onClick={() => onAuthorClick?.(comment.author)}
                style={{
  fontWeight: '500'
}}
              >
                {comment.author.name}
              </button>
              
              <span className="text-muted-foreground text-xs">
                @{comment.author.username}
              </span>

              {comment.author.role && comment.author.role !== 'member' && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  comment.author.role === 'admin' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
                  comment.author.role === 'moderator' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                )}>
                  {comment.author.role}
                </span>
              )}

              {comment.pinned && (
                <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  <Pin style={{
  height: '12px',
  width: '12px'
}} />
                  Pinned
                </span>
              )}

              <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Clock style={{
  height: '12px',
  width: '12px'
}} />
                {formatRelativeTime(comment.timestamp)}
              </span>

              {comment.edited && (
                <span className="text-muted-foreground text-xs">
                  (edited)
                </span>
              )}
            </div>

            {/* Comment Content */}
            <div className="mb-2">
              {comment.deleted ? (
                <span className="text-muted-foreground italic text-sm">
                  [This comment has been deleted]
                </span>
              ) : isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleEditSubmit();
                      }
                      if (e.key === 'Escape') {
                        handleEditCancel();
                      }
                    }}
                  />
                  <div style={{
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px'
}}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEditSubmit}
                      disabled={!editContent.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {comment.content}
                </div>
              )}
            </div>

            {/* Comment Actions */}
            {!comment.deleted && !isEditing && (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-1 h-6 px-2 text-xs',
                    comment.reactions.userLiked && 'text-red-500 hover:text-red-600'
                  )}
                  onClick={handleLike}
                >
                  <div}}
                  >
                    <Heart className={cn('h-3 w-3', comment.reactions.userLiked && 'fill-current')} />
                  </div>
                  {comment.reactions.likes > 0 && comment.reactions.likes}
                </Button>

                {canReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{
  gap: '4px',
  height: '24px',
  paddingLeft: '8px',
  paddingRight: '8px'
}}
                    onClick={handleReply}
                  >
                    <Reply style={{
  height: '12px',
  width: '12px'
}} />
                    Reply
                  </Button>
                )}

                {comment.award && (
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                    <Award style={{
  height: '12px',
  width: '12px'
}} />
                    {comment.award.count}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Options */}
          <CommentOptionsMenu
            comment={comment}
            currentUser={currentUser}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReport={handleReport}
            onPin={handlePin}
          />
        </div>

        {/* Reply Composer */}

          {showReplyComposer && (
            <div
              className="mt-3 ml-11"
            >
              <CommentComposer
                placeholder={`Reply to ${comment.author.name}...`}
                parentId={comment.id}
                author={currentUser}
                expanded
                autoFocus
                onSubmit={handleReplySubmit}
                onCancel={() => setShowReplyComposer(false)}
              />
            </div>
          )}
        

        {/* Replies */}
        {hasReplies && (
          <div className="mt-3">
            {/* Replies Toggle */}
            <Button
              variant="ghost"
              size="sm"
              style={{
  gap: '4px',
  height: '24px',
  paddingLeft: '8px',
  paddingRight: '8px'
}}
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? <ChevronUp style={{
  height: '12px',
  width: '12px'
}} /> : <ChevronDown style={{
  height: '12px',
  width: '12px'
}} />}
              {showReplies ? 'Hide' : 'Show'} {comment.replies!.length} replies
            </Button>

            {/* Replies List */}
            <Collapsible.Root open={showReplies}>
              <Collapsible.Content>
                <div className="space-y-0 border-l border-border ml-6">
                  {comment.replies!.map((reply) => (
                    <Comment
                      key={reply.id}
                      comment={{ ...reply, depth: depth + 1 }}
                      currentUser={currentUser}
                      maxDepth={maxDepth}
                      onCommentSubmit={onCommentSubmit}
                      onCommentLike={onCommentLike}
                      onCommentEdit={onCommentEdit}
                      onCommentDelete={onCommentDelete}
                      onCommentReport={onCommentReport}
                      onCommentPin={onCommentPin}
                      onAuthorClick={onAuthorClick}
                    />
                  ))}
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== COMMENT SORT CONTROLS =====
const CommentSortControls: React.FC<{
  sortBy: string;
  onSortChange: (sort: string) => void;
  commentCount: number;
}> = ({ sortBy, onSortChange, commentCount }) => {
  const sortOptions = [
    { value: 'popular', label: 'Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'controversial', label: 'Controversial' },
  ];

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
      <div className="text-sm text-muted-foreground">
        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
      </div>
      
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="sm" style={{
  gap: '4px'
}}>
              {sortOptions.find(opt => opt.value === sortBy)?.label}
              <ChevronDown style={{
  height: '12px',
  width: '12px'
}} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content style={{
  border: '1px solid var(--border-subtle)',
  padding: '4px'
}}>
              {sortOptions.map((option) => (
                <DropdownMenu.Item
                  key={option.value}
                  className={cn(
                    'px-2 py-1.5 text-sm rounded-sm cursor-pointer outline-none',
                    'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    sortBy === option.value && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => onSortChange(option.value)}
                >
                  {option.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
};

// ===== MAIN COMMENT SYSTEM COMPONENT =====
const CommentSystem = React.forwardRef<HTMLDivElement, CommentSystemProps>(
  (
    {
      className,
      comments,
      postId,
      currentUser,
      maxDepth = 4,
      showReplyComposer = true,
      sortBy = 'popular',
      loading = false,
      onCommentSubmit,
      onCommentLike,
      onCommentEdit,
      onCommentDelete,
      onCommentReport,
      onCommentPin,
      onAuthorClick,
      ...props
    },
    ref
  ) => {
    const [sortOrder, setSortOrder] = React.useState(sortBy);

    // Sort comments based on selected order
    const sortedComments = React.useMemo(() => {
      const sorted = [...comments];
      switch (sortOrder) {
        case 'newest':
          return sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        case 'oldest':
          return sorted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        case 'popular':
          return sorted.sort((a, b) => b.reactions.likes - a.reactions.likes);
        case 'controversial':
          return sorted.sort((a, b) => {
            const aScore = a.reactions.likes / (a.reactions.likes + a.reactions.replies || 1);
            const bScore = b.reactions.likes / (b.reactions.likes + b.reactions.replies || 1);
            return Math.abs(0.5 - aScore) - Math.abs(0.5 - bScore);
          });
        default:
          return sorted;
      }
    }, [comments, sortOrder]);

    const totalComments = React.useMemo(() => {
      const countComments = (comments: CommentData[]): number => {
        return comments.reduce((count, comment) => {
          return count + 1 + (comment.replies ? countComments(comment.replies) : 0);
        }, 0);
      };
      return countComments(comments);
    }, [comments]);

    if (loading) {
      return (
        <div ref={ref} className={cn('space-y-4', className)} {...props}>
          {/* Loading skeleton */}
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
  display: 'flex',
  gap: '12px'
}}>
              <div style={{
  height: '32px',
  width: '32px',
  borderRadius: '50%'
}} />
              <div style={{
  flex: '1'
}}>
                <div style={{
  height: '16px',
  borderRadius: '4px'
}} />
                <div style={{
  height: '64px',
  borderRadius: '4px'
}} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {/* Comment Composer */}
        {showReplyComposer && currentUser && (
          <CommentComposer
            author={currentUser}
            onSubmit={(content) => onCommentSubmit?.(content)}
          />
        )}

        {/* Sort Controls */}
        {comments.length > 0 && (
          <CommentSortControls
            sortBy={sortOrder}
            onSortChange={setSortOrder}
            commentCount={totalComments}
          />
        )}

        {/* Comments List */}
        {sortedComments.length > 0 ? (
          <div style={{
  border: '1px solid var(--border-subtle)'
}}>
            {sortedComments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                maxDepth={maxDepth}
                onCommentSubmit={onCommentSubmit}
                onCommentLike={onCommentLike}
                onCommentEdit={onCommentEdit}
                onCommentDelete={onCommentDelete}
                onCommentReport={onCommentReport}
                onCommentPin={onCommentPin}
                onAuthorClick={onAuthorClick}
              />
            ))}
          </div>
        ) : (
          <div style={{
  textAlign: 'center',
  paddingTop: '48px',
  paddingBottom: '48px'
}}>
            <MessageCircle style={{
  height: '48px',
  width: '48px'
}} />
            <h3 style={{
  fontWeight: '500'
}}>No comments yet</h3>
            <p className="text-muted-foreground">
              Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    );
  }
);

CommentSystem.displayName = 'CommentSystem';

// ===== UTILITY FUNCTIONS =====
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
export { CommentSystem, CommentComposer, Comment };
export type { 
  CommentSystemProps, 
  CommentData, 
  CommentAuthor, 
  CommentReactions,
  CommentComposerProps 
};