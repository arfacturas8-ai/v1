// Core Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  displayName?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: Date;
  joinedAt: Date;
  verified: boolean;
  role: 'user' | 'moderator' | 'admin';
  karma: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  mentions: boolean;
  directMessages: boolean;
  channelUpdates: boolean;
  communityUpdates: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowDirectMessages: 'everyone' | 'friends' | 'none';
  showEmail: boolean;
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
}

// Community Types
export interface Community {
  id: string;
  name: string;
  description: string;
  icon?: string;
  banner?: string;
  memberCount: number;
  isPrivate: boolean;
  category: string;
  rules: string[];
  createdAt: Date;
  moderators: User[];
  tags: string[];
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'video';
  communityId: string;
  position: number;
  isPrivate: boolean;
  permissions: ChannelPermissions;
  lastActivity: Date;
}

export interface ChannelPermissions {
  view: boolean;
  send: boolean;
  connect: boolean;
  speak: boolean;
  moderate: boolean;
}

// Message Types
export interface Message {
  id: string;
  content: string;
  authorId: string;
  author: User;
  channelId: string;
  replyToId?: string;
  replyTo?: Message;
  timestamp: Date;
  editedAt?: Date;
  attachments: Attachment[];
  reactions: Reaction[];
  mentions: User[];
  isDeleted: boolean;
  isPinned: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface Reaction {
  id: string;
  emoji: string;
  count: number;
  users: User[];
  hasReacted: boolean;
}

// Post Types
export interface Post {
  id: string;
  title: string;
  content?: string;
  authorId: string;
  author: User;
  communityId: string;
  community: Community;
  type: 'text' | 'link' | 'image' | 'video';
  url?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  score: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  timestamp: Date;
  editedAt?: Date;
  isStickied: boolean;
  isLocked: boolean;
  isNsfw: boolean;
  flair?: string;
  tags: string[];
  userVote?: 'up' | 'down' | null;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: User;
  postId: string;
  parentId?: string;
  score: number;
  upvotes: number;
  downvotes: number;
  timestamp: Date;
  editedAt?: Date;
  isDeleted: boolean;
  children: Comment[];
  depth: number;
  userVote?: 'up' | 'down' | null;
}

// Voice/Video Types
export interface VoiceState {
  userId: string;
  channelId?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

export interface CallParticipant {
  user: User;
  voiceState: VoiceState;
  connectionState: 'connecting' | 'connected' | 'disconnected';
  quality: 'excellent' | 'good' | 'poor';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    totalPages?: number;
    totalCount?: number;
    hasMore?: boolean;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface CreatePostForm {
  title: string;
  content?: string;
  communityId: string;
  type: 'text' | 'link' | 'image' | 'video';
  url?: string;
  file?: File;
  isNsfw: boolean;
  flair?: string;
  tags: string[];
}

// Event Types
export interface SocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface MessageEvent extends SocketEvent {
  type: 'message:new' | 'message:edit' | 'message:delete';
  payload: Message;
}

export interface UserEvent extends SocketEvent {
  type: 'user:online' | 'user:offline' | 'user:typing';
  payload: {
    userId: string;
    channelId?: string;
  };
}

export interface VoiceEvent extends SocketEvent {
  type: 'voice:join' | 'voice:leave' | 'voice:state';
  payload: VoiceState;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Search Types
export interface SearchResult {
  type: 'user' | 'community' | 'post' | 'message';
  id: string;
  title: string;
  description: string;
  url: string;
  relevance: number;
  timestamp: Date;
}

export interface SearchFilters {
  type?: 'user' | 'community' | 'post' | 'message';
  communityId?: string;
  authorId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'relevance' | 'date' | 'score';
  sortOrder?: 'asc' | 'desc';
}