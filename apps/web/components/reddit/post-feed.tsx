'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, RefreshCw, Filter, TrendingUp, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { Post, PostsResponse, SortType } from './post-types';
import { PostCard } from './post-card';

interface PostFeedProps {
  communityId?: string;
  className?: string;
  showFilters?: boolean;
  initialSort?: SortType;
}

interface FeedState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  total: number;
  sort: SortType;
  refreshing: boolean;
}

const POSTS_PER_PAGE = 25;

export function PostFeed({
  communityId,
  className,
  showFilters = true,
  initialSort = 'hot',
}: PostFeedProps) {
  const [state, setState] = useState<FeedState>({
    posts: [],
    loading: true,
    error: null,
    hasMore: true,
    page: 1,
    total: 0,
    sort: initialSort,
    refreshing: false,
  });

  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);

  // Load posts from API
  const loadPosts = useCallback(async (
    page: number = 1,
    sort: SortType = state.sort,
    append: boolean = false
  ) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setState(prev => ({
        ...prev,
        loading: page === 1 && !append,
        refreshing: page === 1 && append,
        error: null,
      }));

      const response = await api.getPosts({
        page,
        limit: POSTS_PER_PAGE,
        sort,
      });

      if (response.success && response.data) {
        const newPosts = response.data.items || [];
        
        setState(prev => ({
          ...prev,
          posts: append ? [...prev.posts, ...newPosts] : newPosts,
          loading: false,
          refreshing: false,
          hasMore: response.data.hasMore,
          page: response.data.page,
          total: response.data.total,
          sort,
        }));
      } else {
        throw new Error(response.error || 'Failed to load posts');
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Failed to load posts',
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [state.sort]);

  // Load more posts (infinite scroll)
  const loadMore = useCallback(() => {
    if (state.hasMore && !state.loading && !loadingRef.current) {
      loadPosts(state.page + 1, state.sort, true);
    }
  }, [state.hasMore, state.loading, state.page, state.sort, loadPosts]);

  // Refresh posts
  const refresh = useCallback(() => {
    loadPosts(1, state.sort, false);
  }, [state.sort, loadPosts]);

  // Change sort order
  const handleSortChange = useCallback((newSort: SortType) => {
    if (newSort !== state.sort) {
      loadPosts(1, newSort, false);
    }
  }, [state.sort, loadPosts]);

  // Setup infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore]);

  // Attach observer to last post
  useEffect(() => {
    if (lastPostRef.current && observerRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => {
      if (lastPostRef.current && observerRef.current) {
        observerRef.current.unobserve(lastPostRef.current);
      }
    };
  }, [state.posts]);

  // Initial load
  useEffect(() => {
    loadPosts(1, initialSort, false);
  }, [communityId]); // Only re-run when communityId changes

  // Handle vote for a specific post
  const handleVote = useCallback((postId: string, voteValue: any) => {
    // Update the post's vote state optimistically
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            userVote: voteValue,
          };
        }
        return post;
      }),
    }));
  }, []);

  // Handle save/hide callbacks
  const handleSave = useCallback(async (postId: string, saved: boolean) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(post =>
        post.id === postId ? { ...post, userVote: saved ? 1 : 0 } : post
      ),
    }));

    try {
      // TODO: Implement save/unsave API call
      console.log('Post action:', saved ? 'Saved' : 'Unsaved', postId);
    } catch (error) {
      console.error('Failed to save post:', error);
      // Revert optimistic update
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(post =>
          post.id === postId ? { ...post, userVote: !saved ? 1 : 0 } : post
        ),
      }));
    }
  }, []);

  const handleHide = useCallback(async (postId: string) => {
    // Remove from feed
    setState(prev => ({
      ...prev,
      posts: prev.posts.filter(post => post.id !== postId),
    }));

    try {
      // TODO: Implement hide API call
      console.log('Hidden post:', postId);
    } catch (error) {
      console.error('Failed to hide post:', error);
    }
  }, []);

  const handleReport = useCallback(async (postId: string, reason: string) => {
    try {
      // TODO: Implement report API call
      console.log('Reported post:', postId, 'for:', reason);
    } catch (error) {
      console.error('Failed to report post:', error);
    }
  }, []);

  // Sort options with icons
  const sortOptions = [
    { value: 'hot', label: 'Hot', icon: TrendingUp },
    { value: 'new', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: Trophy },
  ] as const;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with filters */}
      {showFilters && (
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Posts</h2>
            {state.total > 0 && (
              <span className="text-sm text-gray-500">
                {state.total.toLocaleString()} posts
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort selector */}
            <Select value={state.sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={state.loading || state.refreshing}
              className="min-w-[100px]"
            >
              {state.refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-4">
        {state.loading && state.posts.length === 0 ? (
          // Initial loading state
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-16 w-16 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))
        ) : state.error ? (
          // Error state
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{state.error}</p>
            <Button onClick={refresh} variant="outline">
              Try Again
            </Button>
          </div>
        ) : state.posts.length === 0 ? (
          // Empty state
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 mb-4">
              {communityId 
                ? "This community doesn't have any posts yet."
                : "No posts match your current filters."
              }
            </p>
            <Button onClick={refresh} variant="outline">
              Refresh
            </Button>
          </div>
        ) : (
          // Posts list
          <>
            {state.posts.map((post, index) => (
              <div
                key={post.id}
                ref={index === state.posts.length - 1 ? lastPostRef : null}
              >
                <PostCard
                  post={post}
                  onVote={(voteValue) => handleVote(post.id, voteValue)}
                  onSave={(saved) => handleSave(post.id, saved)}
                  onHide={() => handleHide(post.id)}
                  onReport={(reason) => handleReport(post.id, reason)}
                />
              </div>
            ))}

            {/* Loading more indicator */}
            {state.hasMore && (
              <div className="flex justify-center py-8">
                {state.loading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading more posts...
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="min-w-[150px]"
                  >
                    Load More
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* End of posts message */}
            {!state.hasMore && state.posts.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>You've reached the end of the posts!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}