// Database schema aligned comment types

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
  post?: {
    id: string;
    title: string;
    community?: {
      id: string;
      name: string;
      displayName: string;
    };
  };
  parent?: Comment;
  replies?: Comment[];
  votes?: Vote[];
  userVote?: VoteValue;
  _count?: {
    replies: number;
    votes: number;
  };
  
  // UI state properties (not from database)
  depth?: number;
  isCollapsed?: boolean;
  repliesLoaded?: boolean;
  hasMoreReplies?: boolean;
  totalReplies?: number;
}

export interface Vote {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  value: number; // -1, 0, 1
  createdAt: string;
}

export type VoteValue = -1 | 0 | 1;
export type CommentSortType = 'top' | 'new' | 'old';

export interface CommentState {
  loading: boolean;
  error: CommentError | null;
  optimisticVote?: VoteValue;
  optimisticScore: number;
  retryCount: number;
  isEditing: boolean;
  isReplying: boolean;
  collapsed: boolean;
  repliesLoaded: boolean;
  repliesLoading: boolean;
  repliesError: string | null;
}

export interface CommentError {
  code: string;
  message: string;
  recoverable: boolean;
  timestamp: string;
}

export interface CommentTreeProps {
  comments: Comment[];
  postId: string;
  maxDepth?: number;
  collapsed?: boolean;
  sort?: CommentSortType;
  onVote?: (commentId: string, voteValue: VoteValue) => Promise<void>;
  onReply?: (parentId: string, content: string) => Promise<Comment>;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onLoadMore?: (parentId: string, after?: string) => Promise<Comment[]>;
  onReport?: (commentId: string, reason: string) => Promise<void>;
  onCollapse?: (commentId: string, collapsed: boolean) => void;
}

export interface CommentFormData {
  content: string;
  parentId?: string;
}

export interface CommentThreadProps {
  comment: Comment;
  depth: number;
  maxDepth: number;
  isLast?: boolean;
  onVote?: (commentId: string, voteValue: VoteValue) => Promise<void>;
  onReply?: (parentId: string, content: string) => Promise<Comment>;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onLoadMore?: (parentId: string, after?: string) => Promise<Comment[]>;
  onReport?: (commentId: string, reason: string) => Promise<void>;
  onCollapse?: (commentId: string, collapsed: boolean) => void;
}

// API response types
export interface CommentsResponse {
  success: boolean;
  data: Comment[];
}

export interface CommentResponse {
  success: boolean;
  data: Comment;
}

export interface VoteResponse {
  success: boolean;
  data: {
    score: number;
  };
}