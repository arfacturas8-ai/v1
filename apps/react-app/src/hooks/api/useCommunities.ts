/**
 * useCommunities Hooks
 * React Query hooks for communities API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  communitiesService,
  Community,
  CreateCommunityData,
  UpdateCommunityData,
} from '../../services/api/communitiesService';
import { toast } from '../../stores/uiStore';
import { getErrorMessage } from '../../utils/errorUtils';

/**
 * Get all communities (infinite scroll)
 */
export const useCommunitiesQuery = (filters?: {
  category?: string;
  type?: string;
  query?: string;
}) => {
  return useInfiniteQuery({
    queryKey: ['communities', 'list', filters],
    queryFn: ({ pageParam }) => communitiesService.getCommunities({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get community by ID
 */
export const useCommunityQuery = (communityId: string) => {
  return useQuery({
    queryKey: ['communities', communityId],
    queryFn: () => communitiesService.getCommunity(communityId),
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get community by slug
 */
export const useCommunityBySlugQuery = (slug: string) => {
  return useQuery({
    queryKey: ['communities', 'slug', slug],
    queryFn: () => communitiesService.getCommunityBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get user's joined communities
 */
export const useMyCommunitiesQuery = () => {
  return useInfiniteQuery({
    queryKey: ['communities', 'me'],
    queryFn: ({ pageParam }) => communitiesService.getMyCommunitiesQuery(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get trending communities
 */
export const useTrendingCommunitiesQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: ['communities', 'trending', limit],
    queryFn: () => communitiesService.getTrendingCommunities(limit),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Get suggested communities
 */
export const useSuggestedCommunitiesQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: ['communities', 'suggested', limit],
    queryFn: () => communitiesService.getSuggestedCommunities(limit),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Search communities
 */
export const useSearchCommunitiesQuery = (query: string, filters?: { type?: string; category?: string }) => {
  return useQuery({
    queryKey: ['communities', 'search', query, filters],
    queryFn: () => communitiesService.searchCommunities(query, filters),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get community members (infinite scroll)
 */
export const useMembersQuery = (communityId: string, role?: string) => {
  return useInfiniteQuery({
    queryKey: ['communities', communityId, 'members', role],
    queryFn: ({ pageParam }) => communitiesService.getMembers(communityId, pageParam, role),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get community channels
 */
export const useChannelsQuery = (communityId: string) => {
  return useQuery({
    queryKey: ['communities', communityId, 'channels'],
    queryFn: () => communitiesService.getChannels(communityId),
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get community posts (infinite scroll)
 */
export const useCommunityPostsQuery = (communityId: string) => {
  return useInfiniteQuery({
    queryKey: ['communities', communityId, 'posts'],
    queryFn: ({ pageParam }) => communitiesService.getCommunityPosts(communityId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!communityId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get community rules
 */
export const useRulesQuery = (communityId: string) => {
  return useQuery({
    queryKey: ['communities', communityId, 'rules'],
    queryFn: () => communitiesService.getRules(communityId),
    enabled: !!communityId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Get community events
 */
export const useEventsQuery = (communityId: string) => {
  return useQuery({
    queryKey: ['communities', communityId, 'events'],
    queryFn: () => communitiesService.getEvents(communityId),
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get community analytics
 */
export const useAnalyticsQuery = (communityId: string, period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['communities', communityId, 'analytics', period],
    queryFn: () => communitiesService.getAnalytics(communityId, period),
    enabled: !!communityId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Get banned members
 */
export const useBannedMembersQuery = (communityId: string) => {
  return useQuery({
    queryKey: ['communities', communityId, 'bans'],
    queryFn: () => communitiesService.getBannedMembers(communityId),
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create community mutation
 */
export const useCreateCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommunityData) => communitiesService.createCommunity(data),
    onSuccess: (newCommunity) => {
      // Invalidate communities lists
      queryClient.invalidateQueries({ queryKey: ['communities', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'me'] });

      toast.success('Community created successfully!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to create community'));
    },
  });
};

/**
 * Update community mutation
 */
export const useUpdateCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: UpdateCommunityData }) =>
      communitiesService.updateCommunity(communityId, data),
    onSuccess: (updatedCommunity, { communityId }) => {
      // Update cache
      queryClient.setQueryData(['communities', communityId], updatedCommunity);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['communities', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'me'] });

      toast.success('Community updated!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to update community'));
    },
  });
};

/**
 * Delete community mutation
 */
export const useDeleteCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => communitiesService.deleteCommunity(communityId),
    onSuccess: (_, communityId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['communities', communityId] });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['communities', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'me'] });

      toast.success('Community deleted');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to delete community'));
    },
  });
};

/**
 * Join community mutation
 */
export const useJoinCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => communitiesService.joinCommunity(communityId),
    onMutate: async (communityId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['communities', communityId] });

      // Snapshot
      const previousCommunity = queryClient.getQueryData<Community>(['communities', communityId]);

      // Optimistically update
      if (previousCommunity) {
        queryClient.setQueryData<Community>(['communities', communityId], {
          ...previousCommunity,
          stats: {
            ...previousCommunity.stats!,
            members: previousCommunity.stats!.members + 1,
          },
          membership: {
            joined: true,
            role: 'member',
            permissions: [],
          },
        });
      }

      return { previousCommunity };
    },
    onSuccess: (_, communityId) => {
      // Invalidate my communities
      queryClient.invalidateQueries({ queryKey: ['communities', 'me'] });

      toast.success('Joined community!');
    },
    onError: (error: any, communityId, context) => {
      // Rollback
      if (context?.previousCommunity) {
        queryClient.setQueryData(['communities', communityId], context.previousCommunity);
      }
      toast.error(getErrorMessage(error, 'Failed to join community'));
    },
    onSettled: (_, __, communityId) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] });
    },
  });
};

/**
 * Leave community mutation
 */
export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => communitiesService.leaveCommunity(communityId),
    onSuccess: (_, communityId) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities', 'me'] });

      toast.success('Left community');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to leave community'));
    },
  });
};

/**
 * Invite member mutation
 */
export const useInviteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communitiesService.inviteMember(communityId, userId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'members'] });

      toast.success('Invitation sent!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to send invitation'));
    },
  });
};

/**
 * Remove member mutation
 */
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communitiesService.removeMember(communityId, userId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] });

      toast.success('Member removed');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to remove member'));
    },
  });
};

/**
 * Update member role mutation
 */
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, userId, role }: { communityId: string; userId: string; role: 'admin' | 'moderator' | 'member' }) =>
      communitiesService.updateMemberRole(communityId, userId, role),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'members'] });

      toast.success('Role updated');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to update role'));
    },
  });
};

/**
 * Create channel mutation
 */
export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: any }) =>
      communitiesService.createChannel(communityId, data),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'channels'] });

      toast.success('Channel created!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to create channel'));
    },
  });
};

/**
 * Update channel mutation
 */
export const useUpdateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, channelId, data }: { communityId: string; channelId: string; data: any }) =>
      communitiesService.updateChannel(communityId, channelId, data),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'channels'] });

      toast.success('Channel updated!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to update channel'));
    },
  });
};

/**
 * Delete channel mutation
 */
export const useDeleteChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, channelId }: { communityId: string; channelId: string }) =>
      communitiesService.deleteChannel(communityId, channelId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'channels'] });

      toast.success('Channel deleted');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to delete channel'));
    },
  });
};

/**
 * Update rules mutation
 */
export const useUpdateRules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, rules }: { communityId: string; rules: any[] }) =>
      communitiesService.updateRules(communityId, rules),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'rules'] });

      toast.success('Rules updated!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to update rules'));
    },
  });
};

/**
 * Ban member mutation
 */
export const useBanMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, userId, reason }: { communityId: string; userId: string; reason?: string }) =>
      communitiesService.banMember(communityId, userId, reason),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'bans'] });

      toast.success('Member banned');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to ban member'));
    },
  });
};

/**
 * Unban member mutation
 */
export const useUnbanMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communitiesService.unbanMember(communityId, userId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'bans'] });

      toast.success('Member unbanned');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to unban member'));
    },
  });
};

/**
 * Report community mutation
 */
export const useReportCommunity = () => {
  return useMutation({
    mutationFn: ({ communityId, reason, details }: { communityId: string; reason: string; details?: string }) =>
      communitiesService.reportCommunity(communityId, reason, details),
    onSuccess: () => {
      toast.success('Report submitted. Thank you for helping keep our community safe.');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to submit report'));
    },
  });
};

/**
 * Upload avatar mutation
 */
export const useUploadCommunityAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, file }: { communityId: string; file: File }) =>
      communitiesService.uploadAvatar(communityId, file),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] });

      toast.success('Avatar updated!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to upload avatar'));
    },
  });
};

/**
 * Upload banner mutation
 */
export const useUploadCommunityBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, file }: { communityId: string; file: File }) =>
      communitiesService.uploadBanner(communityId, file),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] });

      toast.success('Banner updated!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to upload banner'));
    },
  });
};

/**
 * Create event mutation
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, data }: { communityId: string; data: any }) =>
      communitiesService.createEvent(communityId, data),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'events'] });

      toast.success('Event created!');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to create event'));
    },
  });
};

/**
 * Transfer ownership mutation
 */
export const useTransferOwnership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, newOwnerId }: { communityId: string; newOwnerId: string }) =>
      communitiesService.transferOwnership(communityId, newOwnerId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'members'] });

      toast.success('Ownership transferred');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Failed to transfer ownership'));
    },
  });
};

export default {
  useCommunitiesQuery,
  useCommunityQuery,
  useCommunityBySlugQuery,
  useMyCommunitiesQuery,
  useTrendingCommunitiesQuery,
  useSuggestedCommunitiesQuery,
  useSearchCommunitiesQuery,
  useMembersQuery,
  useChannelsQuery,
  useCommunityPostsQuery,
  useRulesQuery,
  useEventsQuery,
  useAnalyticsQuery,
  useBannedMembersQuery,
  useCreateCommunity,
  useUpdateCommunity,
  useDeleteCommunity,
  useJoinCommunity,
  useLeaveCommunity,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
  useUpdateRules,
  useBanMember,
  useUnbanMember,
  useReportCommunity,
  useUploadCommunityAvatar,
  useUploadCommunityBanner,
  useCreateEvent,
  useTransferOwnership,
};
