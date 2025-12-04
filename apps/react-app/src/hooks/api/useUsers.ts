/**
 * useUsers Hooks
 * React Query hooks for users API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { usersService, User, UpdateProfileData } from '../../services/api/usersService';
import { queryKeys } from '../../lib/queryClient';
import { toast } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

/**
 * Get current user
 */
export const useCurrentUserQuery = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.users.detail('me'),
    queryFn: () => usersService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get user by ID
 */
export const useUserQuery = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => usersService.getUser(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get user by username
 */
export const useUserByUsernameQuery = (username: string) => {
  return useQuery({
    queryKey: queryKeys.users.profile(username),
    queryFn: () => usersService.getUserByUsername(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Search users
 */
export const useSearchUsersQuery = (query: string, filters?: { verified?: boolean }) => {
  return useQuery({
    queryKey: ['users', 'search', query, filters],
    queryFn: () => usersService.searchUsers(query, filters),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get suggested users to follow
 */
export const useSuggestedUsersQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: ['users', 'suggested', limit],
    queryFn: () => usersService.getSuggestedUsers(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get user's followers (infinite scroll)
 */
export const useFollowersQuery = (userId: string) => {
  return useInfiniteQuery({
    queryKey: ['users', userId, 'followers'],
    queryFn: ({ pageParam }) => usersService.getFollowers(userId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get user's following (infinite scroll)
 */
export const useFollowingQuery = (userId: string) => {
  return useInfiniteQuery({
    queryKey: ['users', userId, 'following'],
    queryFn: ({ pageParam }) => usersService.getFollowing(userId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get user's posts (infinite scroll)
 */
export const useUserPostsQuery = (userId: string) => {
  return useInfiniteQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: ({ pageParam }) => usersService.getUserPosts(userId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get user's liked posts (infinite scroll)
 */
export const useUserLikesQuery = (userId: string) => {
  return useInfiniteQuery({
    queryKey: ['users', userId, 'likes'],
    queryFn: ({ pageParam }) => usersService.getUserLikes(userId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get user's media posts (infinite scroll)
 */
export const useUserMediaQuery = (userId: string) => {
  return useInfiniteQuery({
    queryKey: ['users', userId, 'media'],
    queryFn: ({ pageParam }) => usersService.getUserMedia(userId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get blocked users
 */
export const useBlockedUsersQuery = () => {
  return useInfiniteQuery({
    queryKey: ['users', 'me', 'blocked'],
    queryFn: ({ pageParam }) => usersService.getBlockedUsers(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get muted users
 */
export const useMutedUsersQuery = () => {
  return useInfiniteQuery({
    queryKey: ['users', 'me', 'muted'],
    queryFn: ({ pageParam }) => usersService.getMutedUsers(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Update profile mutation
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (data: UpdateProfileData) => usersService.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update auth store
      updateUser(updatedUser);

      // Update cache
      queryClient.setQueryData(queryKeys.users.detail('me'), updatedUser);
      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser);
      queryClient.setQueryData(queryKeys.users.profile(updatedUser.username), updatedUser);

      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update profile');
    },
  });
};

/**
 * Upload avatar mutation
 */
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => usersService.uploadAvatar(file),
    onSuccess: (data) => {
      // Invalidate current user to refetch with new avatar
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail('me') });

      toast.success('Avatar updated!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload avatar');
    },
  });
};

/**
 * Upload banner mutation
 */
export const useUploadBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => usersService.uploadBanner(file),
    onSuccess: (data) => {
      // Invalidate current user to refetch with new banner
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail('me') });

      toast.success('Banner updated!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload banner');
    },
  });
};

/**
 * Follow user mutation
 */
export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersService.followUser(userId),
    onMutate: async (userId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(userId) });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData<User>(queryKeys.users.detail(userId));

      // Optimistically update
      if (previousUser) {
        queryClient.setQueryData<User>(queryKeys.users.detail(userId), {
          ...previousUser,
          stats: {
            ...previousUser.stats!,
            followers: previousUser.stats!.followers + 1,
          },
          relationship: {
            ...previousUser.relationship!,
            following: true,
          },
        });
      }

      return { previousUser };
    },
    onSuccess: (data, userId) => {
      toast.success('Following!');
    },
    onError: (error: any, userId, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.users.detail(userId), context.previousUser);
      }
      toast.error(error?.message || 'Failed to follow user');
    },
    onSettled: (data, error, userId) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: ['users', 'suggested'] });
    },
  });
};

/**
 * Unfollow user mutation
 */
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersService.unfollowUser(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(userId) });

      const previousUser = queryClient.getQueryData<User>(queryKeys.users.detail(userId));

      if (previousUser) {
        queryClient.setQueryData<User>(queryKeys.users.detail(userId), {
          ...previousUser,
          stats: {
            ...previousUser.stats!,
            followers: Math.max(0, previousUser.stats!.followers - 1),
          },
          relationship: {
            ...previousUser.relationship!,
            following: false,
          },
        });
      }

      return { previousUser };
    },
    onSuccess: () => {
      toast.success('Unfollowed');
    },
    onError: (error: any, userId, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.users.detail(userId), context.previousUser);
      }
      toast.error(error?.message || 'Failed to unfollow user');
    },
    onSettled: (data, error, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    },
  });
};

/**
 * Block user mutation
 */
export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersService.blockUser(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'blocked'] });

      toast.success('User blocked');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to block user');
    },
  });
};

/**
 * Unblock user mutation
 */
export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersService.unblockUser(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'blocked'] });

      toast.success('User unblocked');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to unblock user');
    },
  });
};

/**
 * Mute user mutation
 */
export const useMuteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersService.muteUser(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'muted'] });

      toast.success('User muted');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to mute user');
    },
  });
};

/**
 * Unmute user mutation
 */
export const useUnmuteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersService.unmuteUser(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'muted'] });

      toast.success('User unmuted');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to unmute user');
    },
  });
};

/**
 * Report user mutation
 */
export const useReportUser = () => {
  return useMutation({
    mutationFn: ({ userId, reason, details }: { userId: string; reason: string; details?: string }) =>
      usersService.reportUser(userId, reason, details),
    onSuccess: () => {
      toast.success('Report submitted. Thank you for helping keep our community safe.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to submit report');
    },
  });
};

/**
 * Connect wallet mutation
 */
export const useConnectWallet = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: ({ address, signature }: { address: string; signature: string }) =>
      usersService.connectWallet(address, signature),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.setQueryData(queryKeys.users.detail('me'), updatedUser);

      toast.success('Wallet connected!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to connect wallet');
    },
  });
};

/**
 * Disconnect wallet mutation
 */
export const useDisconnectWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersService.disconnectWallet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail('me') });

      toast.success('Wallet disconnected');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to disconnect wallet');
    },
  });
};

export default {
  useCurrentUserQuery,
  useUserQuery,
  useUserByUsernameQuery,
  useSearchUsersQuery,
  useSuggestedUsersQuery,
  useFollowersQuery,
  useFollowingQuery,
  useUserPostsQuery,
  useUserLikesQuery,
  useUserMediaQuery,
  useBlockedUsersQuery,
  useMutedUsersQuery,
  useUpdateProfile,
  useUploadAvatar,
  useUploadBanner,
  useFollowUser,
  useUnfollowUser,
  useBlockUser,
  useUnblockUser,
  useMuteUser,
  useUnmuteUser,
  useReportUser,
  useConnectWallet,
  useDisconnectWallet,
};
