import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

interface FollowResponse {
  message: string;
}

export function useFollow(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<FollowResponse> => {
      return apiClient.post(`/api/users/${username}/follow`);
    },
    onSuccess: () => {
      // Invalidate user profile query to refetch with updated counts
      queryClient.invalidateQueries({ queryKey: ['user', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useUnfollow(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<FollowResponse> => {
      return apiClient.delete(`/api/users/${username}/follow`);
    },
    onSuccess: () => {
      // Invalidate user profile query to refetch with updated counts
      queryClient.invalidateQueries({ queryKey: ['user', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}
