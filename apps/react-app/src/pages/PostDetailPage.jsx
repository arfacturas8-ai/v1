/*
 * PostDetailPage.jsx
 *
 * Modern iOS-styled post detail page with comments
 * Features: Clean #FAFAFA background, white cards with subtle shadows,
 * gradient accents, and smooth hover animations
 */

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

      const cachedPost = await offlineStorage.getPost(postId)
      if (cachedPost) {
        setPost(cachedPost)
      }

      const API_BASE = import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1';
      const postResponse = await fetch(`${API_BASE}/posts/${postId}`)
      if (!postResponse.ok) {
        throw new Error(`Failed to load post: ${postResponse.status}`)
      }
      const postData = await postResponse.json()

      if (postData.success) {
        setPost(postData.data)
        await offlineStorage.savePost(postData.data)
      } else {
        throw new Error(postData.error || 'Failed to load post')
      }

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
          loadPostAndComments()
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
          loadPostAndComments()
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
          type: reaction
        })
      })

      if (response.ok) {
        loadPostAndComments()
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
        <main id="main-content" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '80px',
          background: '#FAFAFA'
        }} role="main" aria-label="Page content">
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
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '80px',
          background: '#FAFAFA'
        }}
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
      <div style={{ minHeight: '100vh', paddingTop: '64px', background: '#FAFAFA' }}>
        <main
          id="main-content"
          role="main"
          aria-label="Post detail page"
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: isMobile ? '16px' : '24px'
          }}
        >
          {/* Offline indicator */}
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '16px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '20px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#D97706',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <WifiOff size={20} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                You are offline. Some features may be limited.
              </span>
            </motion.div>
          )}

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            style={{
              marginBottom: '16px',
              marginLeft: '-8px',
              color: '#666666',
              background: 'transparent',
              border: 'none',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.color = '#58a6ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.color = '#666666'
            }}
            aria-label="Go back to previous page"
          >
            <ArrowLeft size={20} />
            Back
          </Button>

          {/* Main content grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 350px',
            gap: '24px'
          }}>
            {/* Left column - Post */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Post card */}
              <Card style={{
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden'
              }}>
                <CardContent style={{ padding: 0 }}>
                  {/* Post header */}
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #F0F0F0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          color: '#666666',
                          marginBottom: '8px',
                          flexWrap: 'wrap'
                        }}>
                          {post.community && (
                            <>
                              <Link
                                to={`/c/${post.community.name}`}
                                style={{
                                  fontWeight: '600',
                                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
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
                              style={{
                                color: '#666666',
                                textDecoration: 'none'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                              u/{post.author?.username || 'unknown'}
                            </Link>
                          </span>
                          <span>•</span>
                          <time dateTime={post.createdAt} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Clock size={20} />
                            {formatTimeAgo(post.createdAt)}
                          </time>
                        </div>

                        <h1 style={{
                          fontSize: isMobile ? '22px' : '28px',
                          fontWeight: '700',
                          marginBottom: '12px',
                          color: '#1A1A1A',
                          wordBreak: 'break-word'
                        }}>
                          {post.title}
                        </h1>

                        {post.flair && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#1A1A1A',
                            marginBottom: '12px'
                          }}>
                            {post.flair}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post content */}
                  <div style={{ padding: '16px' }}>
                    {post.mediaUrl && (
                      <div style={{
                        marginBottom: '16px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        background: '#FAFAFA',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}>
                        {post.mediaType === 'image' ? (
                          <img
                            src={post.mediaUrl}
                            alt={post.title}
                            style={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: '600px',
                              objectFit: 'contain'
                            }}
                            loading="lazy"
                          />
                        ) : post.mediaType === 'video' ? (
                          <video
                            src={post.mediaUrl}
                            controls
                            style={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: '600px'
                            }}
                            preload="metadata"
                            poster={post.thumbnailUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : null}
                      </div>
                    )}

                    {post.url && (() => {
                      try {
                        return (
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '16px',
                              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              textDecoration: 'none',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            <ExternalLink size={20} />
                            {new URL(post.url).hostname}
                          </a>
                        )
                      } catch {
                        return null
                      }
                    })()}

                    {post.content && (
                      <div style={{
                        color: '#666666',
                        fontSize: '15px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {post.content}
                      </div>
                    )}
                  </div>

                  {/* Post actions */}
                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #F0F0F0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}>
                      <VoteButtons
                        postId={post._id}
                        initialVotes={post.votes || 0}
                        initialUserVote={post.userVote}
                        size="md"
                      />

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#666666',
                        fontSize: '14px'
                      }}>
                        <MessageSquare size={20} />
                        <span style={{ fontWeight: '600' }}>
                          {formatNumber(post.commentCount || comments.length)} comments
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#666666',
                          background: 'transparent',
                          border: 'none',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderRadius: '12px',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href)
                          announce('Link copied to clipboard')
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FAFAFA'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <Share2 size={20} />
                        Share
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#666666',
                          background: 'transparent',
                          border: 'none',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderRadius: '12px',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => announce('Post saved')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FAFAFA'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                        aria-label="Save post"
                      >
                        <Bookmark size={20} />
                        Save
                      </Button>

                      {post.viewCount && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginLeft: 'auto',
                          color: '#666666',
                          fontSize: '14px'
                        }}>
                          <Eye size={20} />
                          <span>{formatNumber(post.viewCount)} views</span>
                        </div>
                      )}
                    </div>

                    {post.awards && post.awards.length > 0 && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #F0F0F0'
                      }}>
                        <AwardDisplay awards={post.awards} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Comment composer */}
              {user ? (
                <Card style={{
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <CardContent style={{ padding: '16px' }}>
                    <form onSubmit={handleCommentSubmit} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div>
                        <label htmlFor="comment-input" style={{ display: 'none' }}>
                          Add a comment
                        </label>
                        <textarea
                          id="comment-input"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="What are your thoughts?"
                          rows={4}
                          disabled={submittingComment}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            resize: 'none',
                            fontSize: '15px',
                            border: '1px solid #E5E5E5',
                            background: '#FAFAFA',
                            color: '#1A1A1A',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            opacity: submittingComment ? 0.5 : 1,
                            cursor: submittingComment ? 'not-allowed' : 'text'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="submit"
                          disabled={!newComment.trim() || submittingComment}
                          size="sm"
                          style={{
                            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                            color: '#FFFFFF',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: (!newComment.trim() || submittingComment) ? 'not-allowed' : 'pointer',
                            opacity: (!newComment.trim() || submittingComment) ? 0.5 : 1,
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (newComment.trim() && !submittingComment) {
                              e.currentTarget.style.transform = 'translateY(-2px)'
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (newComment.trim() && !submittingComment) {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                            }
                          }}
                        >
                          Comment
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card style={{
                  background: '#FFFFFF',
                  border: '2px dashed #E5E5E5',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <CardContent style={{
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      marginBottom: '16px',
                      color: '#666666',
                      fontSize: '15px'
                    }}>
                      Sign in to join the discussion
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => navigate('/login')}
                      size="sm"
                      style={{
                        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                        color: '#FFFFFF',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Comments section */}
              <Card style={{
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <CardHeader style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <CardTitle style={{
                      fontSize: '18px',
                      color: '#1A1A1A',
                      fontWeight: '600'
                    }}>
                      Comments ({comments.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent style={{ padding: 0 }}>
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
            {!isMobile && !isTablet && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Community info */}
                {post.community && (
                  <Card style={{
                    background: '#FFFFFF',
                    border: 'none',
                    borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <CardHeader style={{ paddingBottom: '12px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        {post.community.icon ? (
                          <img
                            src={post.community.icon}
                            alt=""
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '16px',
                              objectFit: 'cover'
                            }}
                            loading="lazy"
                          />
                        ) : (
                          <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Users size={20} style={{ color: '#FFFFFF' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <CardTitle style={{
                            fontSize: '16px',
                            color: '#1A1A1A',
                            fontWeight: '600',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            c/{post.community.name}
                          </CardTitle>
                          <CardDescription style={{
                            fontSize: '12px',
                            color: '#666666'
                          }}>
                            {formatNumber(post?.community?.memberCount || 0)} members
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent style={{ paddingTop: 0 }}>
                      <p style={{
                        fontSize: '14px',
                        marginBottom: '16px',
                        color: '#666666',
                        lineHeight: '1.5'
                      }}>
                        {post?.community?.description || 'No description available.'}
                      </p>
                      <Link to={`/c/${post.community.name}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                            color: '#FFFFFF',
                            padding: '10px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                          }}
                        >
                          View Community
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {/* Author info */}
                {post.author && (
                  <Card style={{
                    background: '#FFFFFF',
                    border: 'none',
                    borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <CardHeader style={{ paddingBottom: '12px' }}>
                      <CardTitle style={{
                        fontSize: '16px',
                        color: '#1A1A1A',
                        fontWeight: '600'
                      }}>
                        About the Author
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px'
                      }}>
                        {post.author.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt=""
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                            loading="lazy"
                          />
                        ) : (
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontWeight: '700',
                            fontSize: '18px'
                          }}>
                            {post.author.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link
                            to={`/u/${post.author.username}`}
                            style={{
                              fontWeight: '600',
                              color: '#1A1A1A',
                              textDecoration: 'none',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '15px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            u/{post.author.username}
                          </Link>
                          {post.author.karma && (
                            <p style={{
                              fontSize: '12px',
                              color: '#666666'
                            }}>
                              {formatNumber(post.author.karma)} karma
                            </p>
                          )}
                        </div>
                      </div>
                      <Link to={`/u/${post.author.username}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '12px',
                            border: '1px solid #E5E5E5',
                            background: '#FAFAFA',
                            color: '#666666',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.background = '#F5F5F5'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.background = '#FAFAFA'
                          }}
                        >
                          View Profile
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {/* Post metadata */}
                <Card style={{
                  background: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <CardHeader style={{ paddingBottom: '12px' }}>
                    <CardTitle style={{
                      fontSize: '16px',
                      color: '#1A1A1A',
                      fontWeight: '600'
                    }}>
                      Post Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: '#666666' }}>Posted</span>
                      <time dateTime={post.createdAt} style={{
                        fontWeight: '600',
                        color: '#1A1A1A'
                      }}>
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#666666' }}>Last edited</span>
                        <time dateTime={post.updatedAt} style={{
                          fontWeight: '600',
                          color: '#1A1A1A'
                        }}>
                          {formatTimeAgo(post.updatedAt)}
                        </time>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: '#666666' }}>Comments</span>
                      <span style={{
                        fontWeight: '600',
                        color: '#1A1A1A'
                      }}>
                        {comments.length}
                      </span>
                    </div>
                    {post.viewCount && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: '#666666' }}>Views</span>
                        <span style={{
                          fontWeight: '600',
                          color: '#1A1A1A'
                        }}>
                          {formatNumber(post.viewCount)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Report option */}
                <Card style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <CardContent style={{ padding: '16px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{
                        width: '100%',
                        color: '#EF4444',
                        background: 'transparent',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => announce('Report submitted')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                      aria-label="Report this post"
                    >
                      Report Post
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

PostDetailPage.propTypes = {}

export { PostDetailPage }
