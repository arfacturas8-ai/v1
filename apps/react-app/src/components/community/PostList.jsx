import React, { useState, useEffect, useRef, useCallback } from 'react'
import Post from './Post'
import SortControls from './SortControls'
import LoadingSpinner from './LoadingSpinner'
import { useResponsive } from '../../hooks/useResponsive'

const PostList = ({
  posts = [],
  loading = false,
  error = null,
  hasMore = false,
  sortBy = 'hot',
  timeFilter = 'day',
  onLoadMore,
  onSort,
  onTimeFilter,
  onPostVote,
  onPostComment,
  onPostShare,
  onPostSave,
  onPostReport,
  onPostAward,
  compact = false,
  showCommunity = true,
  className = ''
}) => {
  const { isMobile } = useResponsive()
  const [loadingMore, setLoadingMore] = useState(false)
  const [visiblePosts, setVisiblePosts] = useState([])
  const observerRef = useRef(null)
  const loadTriggerRef = useRef(null)

  // Virtual scrolling for performance with large lists
  const INITIAL_LOAD = 10
  const LOAD_INCREMENT = 10

  useEffect(() => {
    // Reset visible posts when posts change
    setVisiblePosts(posts.slice(0, INITIAL_LOAD))
  }, [posts])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentTrigger = loadTriggerRef.current

    if (!currentTrigger) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          handleLoadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    observer.observe(currentTrigger)
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, loadingMore])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || loading) return

    setLoadingMore(true)

    try {
      // Load more posts from API if needed
      if (onLoadMore && visiblePosts.length >= posts.length) {
        await onLoadMore()
      } else {
        // Load more from existing posts (virtual scrolling)
        const nextBatch = posts.slice(
          visiblePosts.length,
          visiblePosts.length + LOAD_INCREMENT
        )
        setVisiblePosts(prev => [...prev, ...nextBatch])
      }
    } catch (error) {
      console.error('Failed to load more posts:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, loading, onLoadMore, posts, visiblePosts.length])

  const handlePostVote = useCallback(async (postId, voteType, newVote) => {
    try {
      await onPostVote?.(postId, voteType, newVote)
    } catch (error) {
      console.error('Vote failed:', error)
      throw error // Re-throw to let Post component handle optimistic update revert
    }
  }, [onPostVote])

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <div className="card max-w-md mx-auto p-6">
          <div className="flex flex-col items-center gap-4">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor" className="text-error">
              <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm-2 30h4v4h-4v-4zm0-20h4v16h-4V14z"/>
            </svg>
            <div className="text-center">
              <h3 className="font-semibold text-base sm:text-lg mb-2">Something went wrong</h3>
              <p className="text-secondary text-xs sm:text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary w-full sm:w-auto"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`post-list w-full ${className}`}>
      {/* Sort Controls */}
      <div className="mb-4 sm:mb-6">
        <SortControls
          sortBy={sortBy}
          timeFilter={timeFilter}
          onSort={onSort}
          onTimeFilter={onTimeFilter}
        />
      </div>

      {/* Posts */}
      {visiblePosts.length > 0 ? (
        <div className={compact || isMobile ? 'space-y-2' : 'space-y-4'}>
          {visiblePosts.map((post, index) => (
            <Post
              key={`${post.id}-${index}`}
              post={post}
              onVote={handlePostVote}
              onComment={onPostComment}
              onShare={onPostShare}
              onSave={onPostSave}
              onReport={onPostReport}
              onAward={onPostAward}
              compact={compact}
              showCommunity={showCommunity}
              className="animate-fade-in"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'both'
              }}
            />
          ))}
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="flex flex-col items-center gap-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor" className="text-muted/40">
                <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm-8 20c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8-8-3.589-8-8zm12 12c-2.633 0-5.067-.785-7.1-2.131A11.96 11.96 0 0024 32c1.06 0 2.085-.138 3.1-.362C25.067 35.215 22.633 36 20 36z"/>
              </svg>
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-1">No posts yet</h3>
                <p className="text-sm text-muted">
                  Be the first to share something with the community!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load More Trigger */}
      {hasMore && !loading && (
        <div
          ref={loadTriggerRef}
          className="flex justify-center py-6"
        >
          {loadingMore ? (
            <LoadingSpinner />
          ) : (
            <button
              onClick={handleLoadMore}
              className="btn btn-ghost w-full sm:w-auto"
            >
              Load More Posts
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && visiblePosts.length > 0 && (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && visiblePosts.length > 0 && (
        <div className="text-center py-6">
          <p className="text-muted text-xs sm:text-sm">
            You've reached the end!
          </p>
        </div>
      )}
    </div>
  )
}



export default PostList