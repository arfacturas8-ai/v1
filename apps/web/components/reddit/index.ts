// Reddit-style features for the platform
// Main components for building Reddit-like social features

// Core post and feed components
export { PostFeed } from './post-feed';
export { PostCard } from './post-card';
export { PostCreationForm } from './post-creation-form';

// Comment system
export { CommentsSystem } from './comments-system';
export { CommentThread } from './comment-thread';
export { CommentEditor } from './comment-editor';

// Voting system
export { VotingSystem, HorizontalVotingSystem } from './voting-system';

// Award system
export { AwardSystem, useAwards } from './award-system';

// Karma system
export { KarmaSystem, KarmaDisplay, useKarma } from './karma-system';

// Community management
export { CommunityManagement } from './community-management';
export { CommunityCreationForm } from './community-creation-form';

// Types
export type {
  Post,
  PostType,
  PostFormData,
  PostFormState,
  PostFormErrors,
  VoteValue,
  VoteType,
  SortType,
  TimeFrame,
  Community,
  CreatePostData,
  PostsResponse,
  VoteResponse,
} from './post-types';

export type {
  Comment,
  CommentSortType,
  CommentState,
  CommentThreadProps,
  CommentFormData,
  CommentTreeProps,
  CommentsResponse,
  CommentResponse,
  Vote,
} from './comment-types';

export type {
  AwardType,
  AwardInstance,
  AwardEffect,
} from './award-system';

export type {
  KarmaData,
  KarmaBreakdown,
  KarmaTrend,
  KarmaLevel,
  UserKarmaData,
  KarmaLeaderboard,
  KarmaStats,
  TopContent,
  KarmaEvent,
} from './karma-system';

export type {
  CommunityData,
  CommunityStats,
  CommunityRule,
  CommunityModerator,
  CommunitySettings,
  CommunityFlair,
  ModeratorPermission,
} from './community-management';

// Error boundary
export { 
  RedditErrorBoundary, 
  withRedditErrorBoundary, 
  useRedditErrorReporting 
} from '../error-boundaries/reddit-error-boundary';