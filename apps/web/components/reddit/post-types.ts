// Database schema aligned types for Reddit features

// Post interface matching database schema
export interface Post {
  id: string;
  title: string;
  content: string;
  url?: string;
  thumbnail?: string;
  userId: string;
  communityId: string;
  score: number;
  viewCount: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isRemoved?: boolean;
  isDeleted?: boolean;
  isStickied?: boolean;
  isNsfw?: boolean;
  editedAt?: string;
  flair?: PostFlair;
  type?: PostType;
  imageUrl?: string;
  caption?: string;
  linkPreview?: LinkPreview;
  pollOptions?: PollOption[];
  totalVotes?: number;
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  community: {
    id: string;
    name: string;
    displayName: string;
    icon?: string;
  };
  _count?: {
    comments: number;
    votes?: number;
  };
  userVote?: VoteValue;
  awards?: Award[];
}

// Post type definitions
export type PostType = 'text' | 'link' | 'image' | 'poll';
export type VoteType = 'upvote' | 'downvote';

export interface PostFlair {
  text: string;
  color?: string;
  backgroundColor?: string;
}

export interface LinkPreview {
  title: string;
  description?: string;
  image?: string;
  url: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

// Post creation types
export interface CreatePostData {
  communityId: string;
  title: string;
  content?: string;
  type: PostType;
  url?: string;
  flair?: string;
  nsfw?: boolean;
  // For polls
  pollOptions?: string[];
  pollDuration?: number;
}

// Comment interface matching database schema
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string;
  content: string;
  editedAt?: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  parent?: Comment;
  replies?: Comment[];
  votes?: Vote[];
  userVote?: VoteValue;
  _count?: {
    replies: number;
  };
}

// Vote interface matching database schema
export interface Vote {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  value: number; // -1, 0, 1
  createdAt: string;
}

// Award interface matching database schema
export interface Award {
  id: string;
  postId: string;
  userId: string;
  type: string;
  createdAt: string;
}

// Community interface matching database schema
export interface Community {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  banner?: string;
  rules?: any;
  isPublic: boolean;
  isNsfw: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export type VoteValue = -1 | 0 | 1 | null;
export type SortType = 'hot' | 'new' | 'top' | 'controversial';
export type TimeFrame = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

// API response interfaces
export interface PostsResponse {
  success: boolean;
  data: {
    items: Post[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export interface CommentsResponse {
  success: boolean;
  data: Comment[];
}

export interface VoteResponse {
  success: boolean;
  data: {
    score: number;
  };
}

// Error handling types
export interface RedditError {
  code: string;
  message: string;
  recoverable: boolean;
  timestamp: string;
}

export interface PostError {
  code: string;
  message: string;
  recoverable: boolean;
  timestamp: string;
}

export interface PostState {
  loading: boolean;
  error: PostError | null;
  optimisticVote?: VoteType | null;
  optimisticSave?: boolean;
  optimisticScore?: number;
  retryCount: number;
}

export interface CommentState {
  loading: boolean;
  error: RedditError | null;
  optimisticVote?: VoteValue;
  optimisticScore: number;
  isEditing: boolean;
  isReplying: boolean;
  retryCount: number;
  collapsed: boolean;
  repliesLoaded: boolean;
  repliesLoading: boolean;
  repliesError: string | null;
}

// Form interfaces for post creation
export interface PostFormData {
  title: string;
  content: string;
  url?: string;
  type: PostType;
  communityId: string;
  flair?: string;
  nsfw: boolean;
  pollOptions?: string[];
  pollDuration?: number;
}

export interface PostFormErrors {
  title?: string;
  content?: string;
  url?: string;
  communityId?: string;
  pollOptions?: string;
  general?: string;
}

export interface PostFormState {
  data: PostFormData;
  errors: PostFormErrors;
  isSubmitting: boolean;
  isDraft: boolean;
  lastSaved?: Date;
}
