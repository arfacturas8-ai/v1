/**
 * Posts Service
 * API methods for posts, comments, likes, and interactions
 */

import { api } from '../../lib/apiClient';

// Types
export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrls?: string[];
  type: 'text' | 'image' | 'video' | 'audio' | 'poll' | 'link' | 'quote' | 'thread';
  metadata?: any;
  quotedPostId?: string | null;
  parentPostId?: string | null;
  createdAt: string;
  updatedAt: string;

  // Computed fields from backend
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified: boolean;
  };
  stats?: {
    likes: number;
    comments: number;
    reposts: number;
    quotes: number;
    bookmarks: number;
    views: number;
  };
  userInteractions?: {
    liked: boolean;
    reposted: boolean;
    bookmarked: boolean;
  };
  quotedPost?: Post | null;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string | null;
  createdAt: string;
  updatedAt: string;

  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified: boolean;
  };
  stats?: {
    likes: number;
    replies: number;
  };
  userInteractions?: {
    liked: boolean;
  };
}

export interface CreatePostData {
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'poll' | 'link' | 'quote' | 'thread';
  mediaUrls?: string[];
  metadata?: any;
  quotedPostId?: string | null;
  parentPostId?: string | null;
}

export interface UpdatePostData {
  content?: string;
  mediaUrls?: string[];
  metadata?: any;
}

export interface PostFilters {
  userId?: string;
  type?: string;
  feedType?: 'algorithmic' | 'chronological' | 'trending';
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PostsResponse {
  posts: Post[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

// Posts Service
export const postsService = {
  /**
   * Get posts feed with filters
   */
  async getPosts(filters?: PostFilters): Promise<PostsResponse> {
    const params = new URLSearchParams();

    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.feedType) params.append('feedType', filters.feedType);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.cursor) params.append('cursor', filters.cursor);

    const queryString = params.toString();
    const url = `/posts${queryString ? `?${queryString}` : ''}`;

    return api.get<PostsResponse>(url);
  },

  /**
   * Get single post by ID
   */
  async getPost(id: string): Promise<Post> {
    return api.get<Post>(`/posts/${id}`);
  },

  /**
   * Create new post
   */
  async createPost(data: CreatePostData): Promise<Post> {
    return api.post<Post>('/posts', data);
  },

  /**
   * Update existing post
   */
  async updatePost(id: string, data: UpdatePostData): Promise<Post> {
    return api.patch<Post>(`/posts/${id}`, data);
  },

  /**
   * Delete post
   */
  async deletePost(id: string): Promise<void> {
    return api.delete<void>(`/posts/${id}`);
  },

  /**
   * Like/unlike post
   */
  async toggleLike(id: string): Promise<{ liked: boolean; likesCount: number }> {
    return api.post<{ liked: boolean; likesCount: number }>(`/posts/${id}/like`);
  },

  /**
   * Repost/unrepost
   */
  async toggleRepost(id: string): Promise<{ reposted: boolean; repostsCount: number }> {
    return api.post<{ reposted: boolean; repostsCount: number }>(`/posts/${id}/repost`);
  },

  /**
   * Bookmark/unbookmark
   */
  async toggleBookmark(id: string): Promise<{ bookmarked: boolean }> {
    return api.post<{ bookmarked: boolean }>(`/posts/${id}/bookmark`);
  },

  /**
   * Get post comments
   */
  async getComments(postId: string, options?: { page?: number; limit?: number; cursor?: string }): Promise<{
    comments: Comment[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);

    const queryString = params.toString();
    const url = `/posts/${postId}/comments${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  },

  /**
   * Create comment on post
   */
  async createComment(postId: string, content: string, parentCommentId?: string): Promise<Comment> {
    return api.post<Comment>(`/posts/${postId}/comments`, {
      content,
      parentCommentId,
    });
  },

  /**
   * Update comment
   */
  async updateComment(postId: string, commentId: string, content: string): Promise<Comment> {
    return api.patch<Comment>(`/posts/${postId}/comments/${commentId}`, { content });
  },

  /**
   * Delete comment
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    return api.delete<void>(`/posts/${postId}/comments/${commentId}`);
  },

  /**
   * Like/unlike comment
   */
  async toggleCommentLike(postId: string, commentId: string): Promise<{ liked: boolean; likesCount: number }> {
    return api.post<{ liked: boolean; likesCount: number }>(`/posts/${postId}/comments/${commentId}/like`);
  },

  /**
   * Get trending posts
   */
  async getTrendingPosts(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<PostsResponse> {
    return api.get<PostsResponse>(`/posts/trending?timeframe=${timeframe}`);
  },

  /**
   * Get user's feed (following + algorithmic)
   */
  async getFeed(feedType: 'algorithmic' | 'chronological' = 'algorithmic', cursor?: string): Promise<PostsResponse> {
    const params = new URLSearchParams();
    params.append('feedType', feedType);
    if (cursor) params.append('cursor', cursor);

    return api.get<PostsResponse>(`/posts/feed?${params.toString()}`);
  },

  /**
   * Search posts
   */
  async searchPosts(query: string, filters?: {
    type?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PostsResponse> {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters?.type) params.append('type', filters.type);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return api.get<PostsResponse>(`/posts/search?${params.toString()}`);
  },
};

export default postsService;
