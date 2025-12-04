import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

interface BookmarkResponse {
  message: string;
}

export function useBookmark(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<BookmarkResponse> => {
      return apiClient.post(`/api/posts/${postId}/bookmark`);
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previous = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          bookmarkCount: old.bookmarkCount + 1,
          isBookmarked: true,
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
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useUnbookmark(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<BookmarkResponse> => {
      return apiClient.delete(`/api/posts/${postId}/bookmark`);
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      const previous = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['post', postId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          bookmarkCount: Math.max(0, old.bookmarkCount - 1),
          isBookmarked: false,
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
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}
