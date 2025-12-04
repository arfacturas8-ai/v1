import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

interface LikeResponse {
  message: string;
}

// Like/Unlike Post
export function useLikePost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<LikeResponse> => {
      return apiClient.post(`/api/posts/${postId}/like`);
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previous = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          likeCount: old.likeCount + 1,
          isLiked: true,
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['post', postId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUnlikePost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<LikeResponse> => {
      return apiClient.delete(`/api/posts/${postId}/like`);
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previous = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          likeCount: Math.max(0, old.likeCount - 1),
          isLiked: false,
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['post', postId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// Like/Unlike Comment
export function useLikeComment(commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<LikeResponse> => {
      return apiClient.post(`/api/comments/${commentId}/like`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['comment', commentId] });
      const previous = queryClient.getQueryData(['comment', commentId]);

      queryClient.setQueryData(['comment', commentId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          likeCount: old.likeCount + 1,
          isLiked: true,
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['comment', commentId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comment', commentId] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useUnlikeComment(commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<LikeResponse> => {
      return apiClient.delete(`/api/comments/${commentId}/like`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['comment', commentId] });
      const previous = queryClient.getQueryData(['comment', commentId]);

      queryClient.setQueryData(['comment', commentId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          likeCount: Math.max(0, old.likeCount - 1),
          isLiked: false,
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['comment', commentId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comment', commentId] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
