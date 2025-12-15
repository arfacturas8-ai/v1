import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Share2, Bookmark, ExternalLink, Eye, Clock, Users, WifiOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { VoteButtons } from '../components/social/VoteButtons'
import { AwardDisplay } from '../components/social/AwardSystem'
import { ModernThreadedComments } from '../components/social/ModernThreadedComments'
import { SkeletonPost, SkeletonCard } from '../components/ui/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../contexts/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import offlineStorage from '../services/offlineStorage'
import {
  SkipToContent,
  announce,
  useLoadingAnnouncement,
  useErrorAnnouncement
} from '../utils/accessibility.jsx'
import { useResponsive } from '../hooks/useResponsive'
import { getErrorMessage } from '../utils/errorUtils';

export default function PostDetailPage() {
  const { communityName, postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const { isMobile, isTablet } = useResponsive()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    if (postId) {
      loadPostAndComments()
    }

    // Add offline listener
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [postId])

  const loadPostAndComments = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Load from cache instantly
      const cachedPost = await offlineStorage.getPost(postId)
      if (cachedPost) {
        setPost(cachedPost)
      }

      // 2. Fetch fresh data from API
      const API_BASE = import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1';
      const postResponse = await fetch(`${API_BASE}/posts/${postId}`)
      if (!postResponse.ok) {
        throw new Error(`Failed to load post: ${postResponse.status}`)
      }
      const postData = await postResponse.json()

      if (postData.success) {
        setPost(postData.data)
        // 3. Save fresh data to cache
        await offlineStorage.savePost(postData.data)
      } else {
        throw new Error(postData.error || 'Failed to load post')
      }

      // Load comments
      const commentsResponse = await fetch(`${API_BASE}/posts/${postId}/comments`)
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        if (commentsData.success) {
          setComments(commentsData.data || [])
        }
      }

    } catch (error) {
      console.error('Error loading post:', error)
      const errorMsg = 'Failed to load post. Using cached data if available.'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || submittingComment) return

    try {
      setSubmittingComment(true)
      
      const API_BASE = import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1';
      const response = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // In a real app, add auth header
        },
        body: JSON.stringify({
          content: newComment.trim(),
          postId: postId
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setNewComment('')
          showSuccess('Comment posted successfully')
          loadPostAndComments() // Reload to show new comment
        } else {
          throw new Error(getErrorMessage(result.error, 'Failed to post comment'))
        }
      } else {
        throw new Error('Failed to post comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      showError('Failed to post comment. Please try again.')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleCommentReply = async (parentId, content) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1';
      const response = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          postId: postId,
          parentId: parentId
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          showSuccess('Reply posted successfully')
          loadPostAndComments() // Reload to show new reply
        } else {
          throw new Error(getErrorMessage(result.error, 'Failed to post reply'))
        }
      } else {
        throw new Error('Failed to post reply')
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
      showError('Failed to post reply. Please try again.')
    }
  }

  const handleCommentReact = async (commentId, reaction) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1';
      const response = await fetch(`${API_BASE}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reaction // 'up' or 'down'
        })
      })

      if (response.ok) {
        loadPostAndComments() // Reload to show updated scores
      } else {
        throw new Error('Failed to vote on comment')
      }
    } catch (error) {
      console.error('Error voting on comment:', error)
      showError('Failed to vote. Please try again.')
    }
  }


  if (error) {
    return (
      <>
        <SkipToContent targetId="main-content" />
        <main id="main-content" className="min-h-screen flex items-center justify-center pt-20" role="main" aria-label="Page content">
          <EmptyState
            icon="alert"
            title="Error Loading Post"
            description={typeof error === 'string' ? error : 'An error occurred'}
            action={{
              label: "Try Again",
              onClick: loadPostAndComments
            }}
            secondaryAction={{
              label: "Go Back",
              onClick: () => navigate(-1)
            }}
          />
        </main>
      </>
    )
  }

  if (!post) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen flex items-center justify-center pt-20"
      >
        <EmptyState
          icon="file"
          title="Post Not Found"
          description="The post you're looking for doesn't exist."
          action={{
            label: "Back to Community",
            onClick: () => navigate(`/c/${communityName}`)
          }}
        />
      </div>
    )
  }

  const formatTimeAgo = (date) => {
    if (!date) return 'recently'
    const now = new Date()
    const postDate = new Date(date)
    const diff = now - postDate
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return postDate.toLocaleDateString()
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }


  return (
    <>
      <SkipToContent targetId="main-content" />
      <div className="min-h-screen pt-16" style={{ background: 'var(--bg-primary)' }}>
        <main
          id="main-content"
          role="main"
          aria-label="Post detail page"
          className="max-w-5xl mx-auto px-4 py-6"
        >
          {/* Offline indicator */}
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center gap-2 text-amber-600"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
            >
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">You are offline. Some features may be limited.</span>
            </motion.div>
          )}

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Post */}
            <div className="lg:col-span-2 space-y-6">
              {/* Post card */}
              <Card className="overflow-hidden rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <CardContent className="p-0">
                  {/* Post header */}
                  <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Community and author info */}
                        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                          {post.community && (
                            <>
                              <Link
                                to={`/c/${post.community.name}`}
                                className="font-semibold hover:underline"
                                style={{ color: 'var(--color-primary)' }}
                              >
                                c/{post.community.name}
                              </Link>
                              <span>•</span>
                            </>
                          )}
                          <span>
                            Posted by{' '}
                            <Link
                              to={`/u/${post.author?.username || 'unknown'}`}
                              className="hover:underline"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              u/{post.author?.username || 'unknown'}
                            </Link>
                          </span>
                          <span>•</span>
                          <time dateTime={post.createdAt} className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(post.createdAt)}
                          </time>
                        </div>

                        {/* Post title */}
                        <h1 className="text-2xl font-bold mb-3 break-words" style={{ color: 'var(--text-primary)' }}>
                          {post.title}
                        </h1>

                        {/* Post flair/tags */}
                        {post.flair && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#58a6ff]/20 text-[#58a6ff] mb-3">
                            {post.flair}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post content */}
                  <div className="p-4">
                    {/* Media content */}
                    {post.mediaUrl && (
                      <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-tertiary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                        {post.mediaType === 'image' ? (
                          <img
                            src={post.mediaUrl}
                            alt={post.title}
                            className="w-full h-auto max-h-[600px] object-contain"
                            loading="lazy"
                          />
                        ) : post.mediaType === 'video' ? (
                          <video
                            src={post.mediaUrl}
                            controls
                            className="w-full h-auto max-h-[600px]"
                            preload="metadata"
                            poster={post.thumbnailUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : null}
                      </div>
                    )}

                    {/* External link */}
                    {post.url && (() => {
                      try {
                        return (
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 hover:underline mb-4"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <ExternalLink className="w-4 h-4" />
                            {new URL(post.url).hostname}
                          </a>
                        )
                      } catch {
                        return null
                      }
                    })()}

                    {/* Text content */}
                    {post.content && (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)' }}>
                        {post.content}
                      </div>
                    )}
                  </div>

                  {/* Post actions */}
                  <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Vote buttons */}
                      <VoteButtons
                        postId={post._id}
                        initialVotes={post.votes || 0}
                        initialUserVote={post.userVote}
                        size="md"
                      />

                      {/* Comment count */}
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {formatNumber(post.commentCount || comments.length)} comments
                        </span>
                      </div>

                      {/* Share button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 touch-target"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href)
                          announce('Link copied to clipboard')
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>

                      {/* Save button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 touch-target"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={() => {
                          // Save logic would go here
                          announce('Post saved')
                        }}
                        aria-label="Save post"
                      >
                        <Bookmark className="w-4 h-4" />
                        Save
                      </Button>

                      {/* View count */}
                      {post.viewCount && (
                        <div className="flex items-center gap-1.5 ml-auto" style={{ color: 'var(--text-secondary)' }}>
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{formatNumber(post.viewCount)} views</span>
                        </div>
                      )}
                    </div>

                    {/* Awards display */}
                    {post.awards && post.awards.length > 0 && (
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                        <AwardDisplay awards={post.awards} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Comment composer */}
              {user ? (
                <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <CardContent className="p-4 safe-area-bottom">
                    <form onSubmit={handleCommentSubmit} className="space-y-3">
                      <div>
                        <label htmlFor="comment-input" className="sr-only">
                          Add a comment
                        </label>
                        <textarea
                          id="comment-input"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="What are your thoughts?"
                          rows={4}
                          disabled={submittingComment}
                          className="w-full px-3 py-2 rounded-2xl resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={!newComment.trim() || submittingComment}
                          size="sm"
                          className="touch-target"
                          style={{ background: 'var(--color-primary)', color: 'white' }}
                        >
                          Comment
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-2xl border-dashed" style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <CardContent className="p-6 text-center">
                    <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                      Sign in to join the discussion
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => navigate('/login')}
                      size="sm"
                      className="touch-target"
                      style={{ background: 'var(--color-primary)', color: 'white' }}
                    >
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Comments section */}
              <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <CardHeader style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>
                      Comments ({comments.length})
                    </CardTitle>
                    {/* Sort options can be added here */}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {comments.length > 0 ? (
                    <ModernThreadedComments
                      comments={comments}
                      onReply={handleCommentReply}
                      onReact={handleCommentReact}
                      currentUserId={user?._id}
                    />
                  ) : (
                    <EmptyState
                      icon="message"
                      title="No comments yet"
                      description="Be the first to share your thoughts!"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column - Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Community info */}
              {post.community && (
                <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {post.community.icon ? (
                        <img
                          src={post.community.icon}
                          alt=""
                          className="w-12 h-12 rounded-full"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
                          <Users style={{color: "var(--text-primary)"}} className="w-6 h-6 " />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate" style={{ color: 'var(--text-primary)' }}>
                          c/{post.community.name}
                        </CardTitle>
                        <CardDescription className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {formatNumber(post?.community?.memberCount || 0)} members
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {post?.community?.description || 'No description available.'}
                    </p>
                    <Link to={`/c/${post.community.name}`}>
                      <Button variant="primary" size="sm" className="w-full touch-target" style={{ background: 'var(--color-primary)', color: 'white' }}>
                        View Community
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Author info */}
              {post.author && (
                <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base" style={{ color: 'var(--text-primary)' }}>About the Author</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-3">
                      {post.author.avatar ? (
                        <img
                          src={post.author.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full"
                          loading="lazy"
                        />
                      ) : (
                        <div style={{color: "var(--text-primary)"}} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  font-semibold">
                          {post.author.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/u/${post.author.username}`}
                          className="font-semibold hover:underline truncate block"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          u/{post.author.username}
                        </Link>
                        {post.author.karma && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {formatNumber(post.author.karma)} karma
                          </p>
                        )}
                      </div>
                    </div>
                    <Link to={`/u/${post.author.username}`}>
                      <Button variant="outline" size="sm" className="w-full touch-target" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                        View Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Post metadata */}
              <Card className="rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base" style={{ color: 'var(--text-primary)' }}>Post Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Posted</span>
                    <time dateTime={post.createdAt} className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Last edited</span>
                      <time dateTime={post.updatedAt} className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatTimeAgo(post.updatedAt)}
                      </time>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Comments</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{comments.length}</span>
                  </div>
                  {post.viewCount && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Views</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatNumber(post.viewCount)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Report option */}
              <Card className="rounded-2xl" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <CardContent className="p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/20 touch-target"
                    onClick={() => {
                      // Report logic would go here
                      announce('Report submitted')
                    }}
                    aria-label="Report this post"
                  >
                    Report Post
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

PostDetailPage.propTypes = {}

export { PostDetailPage }
