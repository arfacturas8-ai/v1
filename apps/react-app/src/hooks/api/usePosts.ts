/**
 * usePosts Hooks
 * React Query hooks for posts API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postsService, Post, CreatePostData, UpdatePostData, PostFilters, Comment } from '../../services/api/postsService';
import { queryKeys } from '../../lib/queryClient';
import { toast } from '../../stores/uiStore';
import { getErrorMessage } from '../../utils/errorUtils';

/**
 * Get posts feed with filters
 */
export const usePostsQuery = (filters?: PostFilters) => {
  return useQuery({
    queryKey: queryKeys.posts.list(filters),
    queryFn: () => postsService.getPosts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Infinite scroll posts feed
 */
export const useInfinitePostsQuery = (filters?: Omit<PostFilters, 'cursor'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(filters),
    queryFn: ({ pageParam }) => postsService.getPosts({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get single post by ID
 */
export const usePostQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => postsService.getPost(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get user's feed
 */
export const useFeedQuery = (feedType: 'algorithmic' | 'chronological' = 'algorithmic') => {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.feed(feedType),
    queryFn: ({ pageParam }) => postsService.getFeed(feedType, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes for feed
  });
};

/**
 * Get trending posts
 */
export const useTrendingPostsQuery = (timeframe: '24h' | '7d' | '30d' = '24h') => {
  return useQuery({
    queryKey: ['posts', 'trending', timeframe],
    queryFn: () => postsService.getTrendingPosts(timeframe),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Search posts
 */
export const useSearchPostsQuery = (
  query: string,
  filters?: {
    type?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQuery({
    queryKey: ['posts', 'search', query, filters],
    queryFn: () => postsService.searchPosts(query, filters),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create post mutation
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostData) => postsService.createPost(data),
    onSuccess: (newPost) => {
      // Invalidate all posts queries to refetch with new post
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all() });

      toast.success('Post created successfully!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to create post'));
    },
  });
};

/**
 * Update post mutation
 */
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostData }) => postsService.updatePost(id, data),
    onSuccess: (updatedPost) => {
      // Update cache for this specific post
      queryClient.setQueryData(queryKeys.posts.detail(updatedPost.id), updatedPost);

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all() });

      toast.success('Post updated successfully!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to update post'));
    },
  });
};

/**
 * Delete post mutation
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postsService.deletePost(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.posts.detail(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all() });

      toast.success('Post deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to delete post'));
    },
  });
};

/**
 * Like/unlike post mutation
 */
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsService.toggleLike(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData<Post>(queryKeys.posts.detail(postId));

      // Optimistically update
      if (previousPost) {
        queryClient.setQueryData<Post>(queryKeys.posts.detail(postId), {
          ...previousPost,
          stats: {
            ...previousPost.stats!,
            likes: previousPost.userInteractions?.liked
              ? previousPost.stats!.likes - 1
              : previousPost.stats!.likes + 1,
          },
          userInteractions: {
            ...previousPost.userInteractions!,
            liked: !previousPost.userInteractions?.liked,
          },
        });
      }

      return { previousPost };
    },
    onError: (error: any, postId, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(queryKeys.posts.detail(postId), context.previousPost);
      }
      toast.error(getErrorMessage(error, 'Failed to like post'));
    },
    onSettled: (data, error, postId) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },
  });
};

/**
 * Repost/unrepost mutation
 */
export const useRepost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsService.toggleRepost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });

      const previousPost = queryClient.getQueryData<Post>(queryKeys.posts.detail(postId));

      if (previousPost) {
        queryClient.setQueryData<Post>(queryKeys.posts.detail(postId), {
          ...previousPost,
          stats: {
            ...previousPost.stats!,
            reposts: previousPost.userInteractions?.reposted
              ? previousPost.stats!.reposts - 1
              : previousPost.stats!.reposts + 1,
          },
          userInteractions: {
            ...previousPost.userInteractions!,
            reposted: !previousPost.userInteractions?.reposted,
          },
        });
      }

      return { previousPost };
    },
    onError: (error: any, postId, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(queryKeys.posts.detail(postId), context.previousPost);
      }
      toast.error(getErrorMessage(error, 'Failed to repost'));
    },
    onSettled: (data, error, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },
  });
};

/**
 * Bookmark/unbookmark mutation
 */
export const useBookmarkPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsService.toggleBookmark(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });

      const previousPost = queryClient.getQueryData<Post>(queryKeys.posts.detail(postId));

      if (previousPost) {
        queryClient.setQueryData<Post>(queryKeys.posts.detail(postId), {
          ...previousPost,
          userInteractions: {
            ...previousPost.userInteractions!,
            bookmarked: !previousPost.userInteractions?.bookmarked,
          },
        });
      }

      return { previousPost };
    },
    onSuccess: (data) => {
      toast.success(data.bookmarked ? 'Post bookmarked!' : 'Bookmark removed');
    },
    onError: (error: any, postId, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(queryKeys.posts.detail(postId), context.previousPost);
      }
      toast.error(getErrorMessage(error, 'Failed to bookmark post'));
    },
    onSettled: (data, error, postId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },
  });
};

/**
 * Get post comments
 */
export const useCommentsQuery = (postId: string) => {
  return useInfiniteQuery({
    queryKey: ['posts', postId, 'comments'],
    queryFn: ({ pageParam }) => postsService.getComments(postId, { cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!postId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Create comment mutation
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content, parentCommentId }: { postId: string; content: string; parentCommentId?: string }) =>
      postsService.createComment(postId, content, parentCommentId),
    onSuccess: (newComment, { postId }) => {
      // Invalidate comments for this post
      queryClient.invalidateQueries({ queryKey: ['posts', postId, 'comments'] });

      // Update post's comment count
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });

      toast.success('Comment added!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to add comment'));
    },
  });
};

/**
 * Delete comment mutation
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      postsService.deleteComment(postId, commentId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });

      toast.success('Comment deleted!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to delete comment'));
    },
  });
};

/**
 * Like/unlike comment mutation
 */
export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      postsService.toggleCommentLike(postId, commentId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId, 'comments'] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to like comment'));
    },
  });
};

export default {
  usePostsQuery,
  useInfinitePostsQuery,
  usePostQuery,
  useFeedQuery,
  useTrendingPostsQuery,
  useSearchPostsQuery,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useLikePost,
  useRepost,
  useBookmarkPost,
  useCommentsQuery,
  useCreateComment,
  useDeleteComment,
  useLikeComment,
};
