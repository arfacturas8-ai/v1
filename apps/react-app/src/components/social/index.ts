/**
 * CRYB Design System - Social Components
 * Centralized exports for all social/community components
 */

// Vote System
export { VoteButtons } from './VoteButtons';
export type { VoteButtonsProps } from './VoteButtons';

// Award System
export { AwardDisplay, AWARDS } from './AwardSystem';
export type { AwardType, PostAward, AwardDisplayProps } from './AwardSystem';

// Rich Text Editor
export { RichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps } from './RichTextEditor';

// Post Components
export { FeedPostCard } from './FeedPostCard';
export type {
  FeedPost,
  FeedPostAuthor,
  FeedPostCommunity,
  FeedPostMedia,
  FeedPostCardProps,
} from './FeedPostCard';

export { PostCard, Avatar, MediaGallery, ReactionBar } from './post-card';
export type {
  PostCardProps,
  PostData,
  PostAuthor,
  PostMedia,
  PostReactions,
} from './post-card';

// Comment System
export { ModernThreadedComments } from './ModernThreadedComments';
export type {
  Comment,
  CommentAuthor,
  ModernThreadedCommentsProps,
} from './ModernThreadedComments';
