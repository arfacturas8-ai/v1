import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

interface RepostResponse {
  message: string;
  repost: {
    id: string;
    userId: string;
    postId: string;
    comment: string | null;
    createdAt: string;
  };
}

interface RepostOptions {
  comment?: string;
}

export function useRepost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: RepostOptions): Promise<RepostResponse> => {
      return apiClient.post(`/api/posts/${postId}/repost`, options);
    },
    // Optimistic update
    onMutate: async (options) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previous = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          repostCount: old.repostCount + 1,
          quoteCount: options?.comment ? old.quoteCount + 1 : old.quoteCount,
          isReposted: true,
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

export function useUnrepost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      return apiClient.delete(`/api/posts/${postId}/repost`);
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previous = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          repostCount: Math.max(0, old.repostCount - 1),
          isReposted: false,
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
