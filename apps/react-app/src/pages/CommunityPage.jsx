/**
 * CRYB Platform - Community Page
 * Modern iOS Aesthetic - Ultra Clean & Minimal
 *
 * DESIGN PRINCIPLES:
 * - Light theme with soft shadows
 * - Delicate borders and glassmorphism
 * - Generous whitespace
 * - System font feel
 * - Smooth transitions
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Users, Plus, TrendingUp, MessageSquare, ChevronUp, ChevronDown,
  Share2, Bookmark, MoreHorizontal, Calendar, Shield, Clock,
  Eye, Star, Filter, ArrowUp, ArrowDown, Flame, Zap, WifiOff,
  CheckCircle, UserPlus
} from 'lucide-react'
import { Card, Button, Input, Textarea } from '../components/ui'
import offlineStorage from '../services/offlineStorage'
import communityService from '../services/communityService'
import postsService from '../services/postsService'
import { useAuth } from '../contexts/AuthContext'
import {
  SkipToContent,
  announce,
  useLoadingAnnouncement,
  useErrorAnnouncement,
  AccessibleFormField
} from '../utils/accessibility.jsx'

function CommunityPage() {
  const { communityName } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [community, setCommunity] = useState(null)
  const [posts, setPosts] = useState([])
  const [isJoined, setIsJoined] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', type: 'text' })
  const [showPostForm, setShowPostForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('hot')
  const [userVotes, setUserVotes] = useState({})
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [joinLoading, setJoinLoading] = useState(false)

  // Accessibility: Announce loading and error states to screen readers
  useLoadingAnnouncement(loading, `Loading ${communityName} community`)
  useErrorAnnouncement(error)

  // Extract loadCommunity as a callback for retry functionality
  const loadCommunity = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Load from cache instantly
      const cachedPosts = await offlineStorage.getPosts({ communityName })

      if (cachedPosts.length > 0) {
        setPosts(cachedPosts)
      }

      // 2. Fetch community data from API
      const communityResponse = await communityService.getCommunityByName(communityName)

      if (!communityResponse.success) {
        // Community not found
        setCommunity(null)
        setLoading(false)
        return
      }

      const communityData = communityResponse.community
      setCommunity(communityData)
      setIsJoined(communityData.isMember || false)

      // 3. Fetch community posts
      const postsResponse = await postsService.getPosts({
        communityId: communityData.id,
        sort: sortBy,
        limit: 20
      })

      if (postsResponse.success) {
        setPosts(postsResponse.posts || [])
        // Save to cache for offline access
        await offlineStorage.savePosts(postsResponse.posts || [])
      }

    } catch (err) {
      console.error('Error loading community:', err)
      setError('Failed to load community data. Using cached data if available.')
    } finally {
      setLoading(false)
    }
  }, [communityName, sortBy])

  useEffect(() => {
    loadCommunity()

    // Add offline listener
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [communityName, loadCommunity])

  const handleJoin = useCallback(async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!community?.id) return

    setJoinLoading(true)
    try {
      if (!isJoined) {
        const response = await communityService.joinCommunity(community.id)
        if (response.success) {
          setIsJoined(true)
          setCommunity({ ...community, memberCount: (community.memberCount || 0) + 1 })
          announce(`Joined ${community.displayName || community.name}`)
        }
      } else {
        const response = await communityService.leaveCommunity(community.id)
        if (response.success) {
          setIsJoined(false)
          setCommunity({ ...community, memberCount: Math.max(0, (community.memberCount || 1) - 1) })
          announce(`Left ${community.displayName || community.name}`)
        }
      }
    } catch (err) {
      console.error('Error joining/leaving community:', err)
    } finally {
      setJoinLoading(false)
    }
  }, [isJoined, community, user, navigate])

  const handleCreatePost = useCallback(async (e) => {
    e.preventDefault()

    if (!user) {
      navigate('/login')
      return
    }

    if (!community?.id) return

    try {
      const postData = {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        communityId: community.id,
        type: newPost.type
      }

      const response = await postsService.createPost(postData)

      if (response.success) {
        // Add the new post to the top of the list
        const createdPost = response.data?.post || response.post
        if (createdPost) {
          setPosts([createdPost, ...posts])
        }
        setNewPost({ title: '', content: '', type: 'text' })
        setShowPostForm(false)
        announce('Post created successfully')
      }
    } catch (err) {
      console.error('Error creating post:', err)
    }
  }, [newPost, community, posts, user, navigate])

  const handleVote = useCallback((postId, voteType) => {
    const currentVote = userVotes[postId]
    let newVote = voteType

    // If clicking the same vote type, remove the vote
    if (currentVote === voteType) {
      newVote = null
    }

    setUserVotes({ ...userVotes, [postId]: newVote })

    setPosts(posts.map(post => {
      if (post.id === postId) {
        let upvotes = post.upvotes
        let downvotes = post.downvotes

        // Remove previous vote effect
        if (currentVote === 'up') upvotes--
        else if (currentVote === 'down') downvotes--

        // Apply new vote effect
        if (newVote === 'up') upvotes++
        else if (newVote === 'down') downvotes++

        return {
          ...post,
          upvotes,
          downvotes,
          score: upvotes - downvotes
        }
      }
      return post
    }))
  }, [userVotes, posts])

  // Memoize filtered posts to remove null/undefined values
  const filteredPosts = useMemo(() => {
    return posts.filter(post => post !== null && post !== undefined)
  }, [posts])

  // Memoize sorted posts with expensive sort algorithm
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      switch (sortBy) {
        case 'hot':
          // Prioritize pinned posts and recent popular posts
          if (a.pinned && !b.pinned) return -1
          if (!a.pinned && b.pinned) return 1
          return (b.score + b.comments * 0.5) - (a.score + a.comments * 0.5)
        case 'new':
          return new Date(b.created) - new Date(a.created)
        case 'top':
          return b.score - a.score
        case 'rising':
          // Simple rising algorithm based on recent score and time
          const aAge = (Date.now() - new Date(a.created).getTime()) / (1000 * 60 * 60) // hours
          const bAge = (Date.now() - new Date(b.created).getTime()) / (1000 * 60 * 60)
          const aRising = a.score / Math.max(aAge, 1)
          const bRising = b.score / Math.max(bAge, 1)
          return bRising - aRising
        default:
          return 0
      }
    })
  }, [filteredPosts, sortBy])

  const formatTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }, [])

  // Loading state
  if (loading) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
        <div style={{ background: 'white', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '24px', maxWidth: '480px', margin: '0 16px' }}>
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex', marginBottom: '24px' }}>
              <Shield style={{ width: "48px", height: "48px", flexShrink: 0, color: '#ef4444' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#000000' }}>Error Loading Community</h2>
            <p style={{ marginBottom: '24px', color: '#666666' }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            <Button
              onClick={loadCommunity}
              variant="primary"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                height: '56px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Community not found state
  if (!community) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
        <div style={{ background: 'white', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '24px', maxWidth: '480px', margin: '0 16px' }}>
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ padding: '16px', borderRadius: '50%', background: '#FAFAFA', border: '1px solid rgba(0, 0, 0, 0.08)', display: 'inline-flex', marginBottom: '24px' }}>
              <Users style={{width: "48px", height: "48px", flexShrink: 0, color: '#999999'}} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#000000' }}>Community Not Found</h2>
            <p style={{ marginBottom: '24px', color: '#666666' }}>c/{communityName} doesn't exist yet.</p>
            <div style={{ display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: '12px' }}>
              <Link to="/create-community" style={{ flex: 1 }}>
                <Button
                  variant="primary"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: 'white',
                    height: '56px',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Create Community
                </Button>
              </Link>
              <Link to="/communities" style={{ flex: 1 }}>
                <Button
                  variant="secondary"
                  style={{
                    width: '100%',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    color: '#666666',
                    height: '56px',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Browse Communities
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Memoize sort options
  const sortOptions = useMemo(() => [
    {id: 'hot', label: 'Hot', icon: Flame},
    {id: 'new', label: 'New', icon: Clock},
    {id: 'top', label: 'Top', icon: TrendingUp},
    {id: 'rising', label: 'Rising', icon: Zap}
  ], [])

  // Memoize community stats
  const communityStats = useMemo(() => {
    if (!community) return []
    return [
      { label: 'Members', value: community.memberCount.toLocaleString(), icon: Users },
      { label: 'Online', value: community.onlineCount, icon: Eye },
      { label: 'Posts Today', value: community.postsToday, icon: MessageSquare }
    ]
  }, [community])

  // Memoize filtered moderators
  const displayModerators = useMemo(() => {
    return community?.moderators?.filter(mod => mod !== null && mod !== undefined) || []
  }, [community?.moderators])

  // Memoize filtered rules
  const displayRules = useMemo(() => {
    return community?.rules?.filter(rule => rule !== null && rule !== undefined) || []
  }, [community?.rules])

  // Memoize event handlers
  const handleTogglePostForm = useCallback(() => {
    setShowPostForm(prev => !prev)
  }, [])

  const handleCancelPost = useCallback(() => {
    setShowPostForm(false)
    setNewPost({ title: '', content: '', type: 'text' })
  }, [])

  const handlePostTypeChange = useCallback((type) => {
    setNewPost(prev => ({ ...prev, type }))
  }, [])

  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy)
  }, [])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  return (
    <>
      <SkipToContent targetId="community-main-content" />

      <div style={{ minHeight: '100vh', background: '#FAFAFA', paddingTop: isMobile ? '56px' : '72px' }}>
        {/* Offline indicator */}
        {isOffline && (
          <div style={{ background: 'rgba(234, 179, 8, 0.15)', borderBottom: '1px solid rgba(234, 179, 8, 0.2)', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ca8a04' }}>
              <WifiOff style={{ width: "20px", height: "20px", flexShrink: 0 }} />
              <span style={{ fontSize: '14px' }}>You're offline. Viewing cached content.</span>
            </div>
          </div>
        )}

        {/* Community Header */}
        <div style={{ background: 'white', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '24px 16px' : '32px 24px' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Community Icon */}
                <div style={{
                  width: isMobile ? '64px' : '80px',
                  height: isMobile ? '64px' : '80px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '28px',
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
                  color: 'white'
                }}>
                  {community?.displayName?.[0]?.toUpperCase() || 'C'}
                </div>

                {/* Community Info */}
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '4px', color: '#000000' }}>
                    c/{community?.displayName}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#666666', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                      {community?.memberCount?.toLocaleString()} members
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                      {community?.onlineCount} online
                    </span>
                    {community?.trending && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6366F1' }}>
                        <TrendingUp style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                        Trending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Join Button */}
              <Button
                onClick={handleJoin}
                variant={isJoined ? 'secondary' : 'primary'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '56px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: isJoined ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                  cursor: 'pointer',
                  background: isJoined ? 'white' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: isJoined ? '#666666' : 'white',
                  boxShadow: isJoined ? 'none' : '0 4px 16px rgba(99, 102, 241, 0.2)',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
                aria-label={isJoined ? `Leave ${community?.displayName}` : `Join ${community?.displayName}`}
              >
                {isJoined ? (
                  <>
                    <CheckCircle style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                    Joined
                  </>
                ) : (
                  <>
                    <UserPlus style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                    Join Community
                  </>
                )}
              </Button>
            </div>

            {/* Community Description */}
            {community?.description && (
              <p style={{ marginTop: '16px', maxWidth: '900px', color: '#666666', lineHeight: '1.5' }}>{community.description}</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '24px 16px' : '32px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }} id="community-main-content">
            {/* Posts Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Create Post Button/Form */}
              {isJoined && (
                <div style={{ background: 'white', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  {!showPostForm ? (
                    <button
                      onClick={handleTogglePostForm}
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '14px',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: '#FAFAFA',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        color: '#666666',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                      Create a post
                    </button>
                  ) : (
                    <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <AccessibleFormField
                        label="Post Title"
                        id="post-title"
                        required
                        error={newPost.title.length > 300 ? 'Title is too long' : undefined}
                      >
                        <Input
                          id="post-title"
                          value={newPost.title}
                          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                          placeholder="Enter post title..."
                          style={{
                            width: '100%',
                            height: '52px',
                            borderRadius: '14px',
                            padding: '0 16px',
                            background: '#FAFAFA',
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            color: '#000000',
                            fontSize: '16px',
                            outline: 'none'
                          }}
                          required
                        />
                      </AccessibleFormField>

                      <AccessibleFormField
                        label="Post Content"
                        id="post-content"
                        required
                      >
                        <Textarea
                          id="post-content"
                          value={newPost.content}
                          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                          placeholder="Share your thoughts..."
                          style={{
                            width: '100%',
                            minHeight: '128px',
                            borderRadius: '14px',
                            padding: '16px',
                            background: '#FAFAFA',
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            color: '#000000',
                            fontSize: '16px',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                          required
                        />
                      </AccessibleFormField>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          type="submit"
                          variant="primary"
                          style={{
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            color: 'white',
                            height: '48px',
                            paddingLeft: '24px',
                            paddingRight: '24px',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Post
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCancelPost}
                          style={{
                            background: 'white',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            color: '#666666',
                            height: '48px',
                            paddingLeft: '24px',
                            paddingRight: '24px',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Sort Controls */}
              <div style={{ background: 'white', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '20px', padding: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {sortOptions.map((option) => {
                    const Icon = option.icon
                    const isActive = sortBy === option.id
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSortChange(option.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '15px',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          border: 'none',
                          cursor: 'pointer',
                          background: isActive ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#FAFAFA',
                          color: isActive ? 'white' : '#666666',
                          boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none'
                        }}
                        aria-pressed={isActive}
                      >
                        <Icon style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Posts List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedPosts.length === 0 ? (
                  <div style={{ background: 'white', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '24px', padding: '64px 32px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                    <div style={{ marginBottom: '16px', display: 'inline-block' }}>
                      <MessageSquare style={{width: "64px", height: "64px", flexShrink: 0, color: '#999999'}} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#000000' }}>No posts yet</h3>
                    <p style={{ color: '#666666' }}>Be the first to post in this community!</p>
                  </div>
                ) : (
                  sortedPosts.map((post) => (
                    <article
                      key={post.id}
                      style={{
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.2s ease',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                      }}
                    >
                      <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          {/* Vote Section */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <button
                              onClick={() => handleVote(post.id, 'up')}
                              style={{
                                padding: '4px',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: userVotes[post.id] === 'up' ? '#6366F1' : '#999999'
                              }}
                              aria-label={`Upvote post: ${post.title}`}
                            >
                              <ChevronUp style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                            </button>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '700',
                              color: post.score > 0 ? '#6366F1' : post.score < 0 ? '#8B5CF6' : '#999999'
                            }}>
                              {post.score}
                            </span>
                            <button
                              onClick={() => handleVote(post.id, 'down')}
                              style={{
                                padding: '4px',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: userVotes[post.id] === 'down' ? '#8B5CF6' : '#999999'
                              }}
                              aria-label={`Downvote post: ${post.title}`}
                            >
                              <ChevronDown style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                            </button>
                          </div>

                          {/* Post Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                              <div style={{ flex: 1 }}>
                                {post.pinned && (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: '#6366F1',
                                    fontSize: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    fontWeight: '600'
                                  }}>
                                    Pinned
                                  </span>
                                )}
                                <Link
                                  to={`/posts/${post.id}`}
                                  style={{ textDecoration: 'none' }}
                                >
                                  <h3
                                    style={{
                                      fontSize: '20px',
                                      fontWeight: '600',
                                      transition: 'color 0.2s ease',
                                      marginBottom: '8px',
                                      color: '#000000'
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = '#6366F1'}
                                    onMouseLeave={(e) => e.target.style.color = '#000000'}
                                  >
                                    {post.title}
                                  </h3>
                                </Link>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '12px', color: '#666666' }}>
                                  <span>Posted by u/{post.author}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(post.created)}</span>
                                </div>
                              </div>
                            </div>

                            {post.content && (
                              <p style={{
                                marginBottom: '16px',
                                color: '#666666',
                                lineHeight: '1.5',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>{post.content}</p>
                            )}

                            {/* Post Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
                              <Link
                                to={`/posts/${post.id}`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'color 0.2s ease',
                                  color: '#666666',
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#6366F1'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
                              >
                                <MessageSquare style={{ width: "18px", height: "18px", flexShrink: 0 }} />
                                <span>{post.comments} comments</span>
                              </Link>
                              <button
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'color 0.2s ease',
                                  color: '#666666',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  padding: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#6366F1'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
                              >
                                <Share2 style={{ width: "18px", height: "18px", flexShrink: 0 }} />
                                <span>Share</span>
                              </button>
                              <button
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'color 0.2s ease',
                                  color: '#666666',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  padding: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#6366F1'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
                              >
                                <Bookmark style={{ width: "18px", height: "18px", flexShrink: 0 }} />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* About Community */}
              <div style={{ background: 'white', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#000000' }}>About Community</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {communityStats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666666' }}>
                          <Icon style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                          <span>{stat.label}</span>
                        </div>
                        <span style={{ fontWeight: '600', color: '#000000' }}>{stat.value}</span>
                      </div>
                    )
                  })}
                  {community?.createdAt && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666666' }}>
                        <Calendar style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                        <span>Created</span>
                      </div>
                      <span style={{ fontWeight: '600', color: '#000000' }}>
                        {new Date(community.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Community Rules */}
              {displayRules.length > 0 && (
                <div style={{ background: 'white', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#000000' }}>
                    <Shield style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                    Rules
                  </h2>
                  <ol style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: 0, listStyle: 'none' }}>
                    {displayRules.map((rule, index) => (
                      <li key={index} style={{ fontSize: '14px', display: 'flex', gap: '12px', color: '#666666' }}>
                        <span style={{ fontWeight: '600', color: '#999999' }}>{index + 1}.</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Moderators */}
              {displayModerators.length > 0 && (
                <div style={{ background: 'white', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#000000' }}>Moderators</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {displayModerators.map((mod, index) => (
                      <Link
                        key={index}
                        to={`/user/${mod}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'color 0.2s ease',
                          color: '#666666',
                          textDecoration: 'none',
                          fontSize: '15px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#6366F1'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          flexShrink: 0,
                          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {mod[0].toUpperCase()}
                        </div>
                        <span>u/{mod}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


export default CommunityPage
