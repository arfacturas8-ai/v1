import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Users, Plus, TrendingUp, MessageSquare, ChevronUp, ChevronDown,
  Share2, Bookmark, MoreHorizontal, Calendar, Shield, Clock,
  Eye, Star, Filter, ArrowUp, ArrowDown, Flame, Zap, WifiOff,
  CheckCircle, UserPlus
} from 'lucide-react'
import { Card, Button, Input, Textarea } from '../components/ui'
import offlineStorage from '../services/offlineStorage'
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

  // Accessibility: Announce loading and error states to screen readers
  useLoadingAnnouncement(loading, `Loading ${communityName} community`)
  useErrorAnnouncement(error)

  // Mock community data with enhanced features
  const mockCommunityData = {
    name: communityName,
    displayName: communityName?.charAt(0).toUpperCase() + communityName?.slice(1) || 'Community',
    description: `Welcome to c/${communityName} - A vibrant community for passionate discussions and sharing knowledge.`,
    memberCount: 45230,
    onlineCount: 892,
    createdAt: '2023-06-15T00:00:00Z',
    banner: null,
    icon: null,
    category: 'general',
    rules: [
      'Be respectful and civil',
      'No spam or self-promotion',
      'Use appropriate flairs',
      'Search before posting',
      'Follow community content policy'
    ],
    moderators: ['user1', 'user2', 'moderator3'],
    postsToday: 23,
    trending: true
  }

  // Enhanced mock posts data
  const mockPosts = [
    {
      id: '1',
      title: 'Welcome to our amazing community! 🎉',
      content: 'This is a great place to share ideas and connect with like-minded people. Looking forward to seeing what everyone shares!',
      author: 'communitymod',
      score: 156,
      upvotes: 172,
      downvotes: 16,
      comments: 24,
      created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      community: communityName,
      type: 'text',
      pinned: true,
      awards: ['gold', 'silver']
    },
    {
      id: '2',
      title: 'Interesting discussion about the latest trends',
      content: 'What do you all think about the recent developments in our field? I\'d love to hear different perspectives.',
      author: 'thoughtfuluser',
      score: 89,
      upvotes: 95,
      downvotes: 6,
      comments: 18,
      created: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      community: communityName,
      type: 'text'
    },
    {
      id: '3',
      title: 'Check out this amazing resource I found',
      content: 'I stumbled upon this incredible tool that I think the community would appreciate. It has really helped me improve my workflow.',
      author: 'helpfulcontributor',
      score: 234,
      upvotes: 267,
      downvotes: 33,
      comments: 45,
      created: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      community: communityName,
      type: 'link',
      trending: true
    }
  ]

  useEffect(() => {
    const loadCommunity = async () => {
      setLoading(true)
      setError(null)

      try {
        // 1. Load from cache instantly
        const cachedPosts = await offlineStorage.getPosts({ communityName })

        if (cachedPosts.length > 0) {
          setPosts(cachedPosts)
        }

        // 2. Fetch fresh data (simulated with mock data)
        await new Promise(resolve => setTimeout(resolve, 500))

        setCommunity(mockCommunityData)
        setPosts(mockPosts)
        setIsJoined(Math.random() > 0.5) // Random join status

        // 3. Save fresh data to cache
        await offlineStorage.savePosts(mockPosts)

      } catch (err) {
        console.error('Error loading community:', err)
        setError('Failed to load community data. Using cached data if available.')
      } finally {
        setLoading(false)
      }
    }

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
  }, [communityName])

  const handleJoin = useCallback(() => {
    if (!isJoined) {
      setIsJoined(true)
      setCommunity({ ...community, memberCount: community.memberCount + 1 })
    } else {
      setIsJoined(false)
      setCommunity({ ...community, memberCount: community.memberCount - 1 })
    }
  }, [isJoined, community])

  const handleCreatePost = useCallback((e) => {
    e.preventDefault()

    const post = {
      id: `post_${Date.now()}`,
      title: newPost.title,
      content: newPost.content,
      community: communityName,
      author: 'currentuser',
      score: 1,
      upvotes: 1,
      downvotes: 0,
      comments: 0,
      created: new Date().toISOString(),
      type: newPost.type
    }

    setPosts([post, ...posts])
    setNewPost({ title: '', content: '', type: 'text' })
    setShowPostForm(false)
  }, [newPost, communityName, posts])

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
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content Skeleton */}
              <div className="lg:col-span-3">
                {/* Header skeleton */}
                <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 mb-6 animate-pulse">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 bg-[#0d1117] rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-8 w-48 bg-[#0d1117] rounded mb-2"></div>
                          <div className="h-4 w-32 bg-[#0d1117] rounded mb-3"></div>
                          <div className="h-4 w-full bg-[#0d1117] rounded"></div>
                        </div>
                      </div>
                      <div className="h-10 w-24 bg-[#0d1117] rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Sort Controls skeleton */}
                <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 mb-6 animate-pulse">
                  <div className="p-4">
                    <div className="flex gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-8 w-16 bg-[#0d1117] rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Posts skeleton */}
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 p-6 animate-pulse">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-6 w-6 bg-[#0d1117] rounded"></div>
                          <div className="h-6 w-8 bg-[#0d1117] rounded"></div>
                          <div className="h-6 w-6 bg-[#0d1117] rounded"></div>
                        </div>
                        <div className="flex-1">
                          <div className="h-6 w-3/4 bg-[#0d1117] rounded mb-3"></div>
                          <div className="h-4 w-full bg-[#0d1117] rounded mb-2"></div>
                          <div className="h-4 w-2/3 bg-[#0d1117] rounded mb-4"></div>
                          <div className="flex gap-4">
                            <div className="h-4 w-16 bg-[#0d1117] rounded"></div>
                            <div className="h-4 w-20 bg-[#0d1117] rounded"></div>
                            <div className="h-4 w-12 bg-[#0d1117] rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="lg:col-span-1">
                <div className="space-y-6">
                  <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 animate-pulse">
                    <div className="p-6">
                      <div className="h-6 w-32 bg-[#0d1117] rounded mb-4"></div>
                      <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex justify-between">
                            <div className="h-4 w-16 bg-[#0d1117] rounded"></div>
                            <div className="h-4 w-12 bg-[#0d1117] rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 animate-pulse">
                    <div className="p-6">
                      <div className="h-6 w-24 bg-[#0d1117] rounded mb-4"></div>
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-4 w-full bg-[#0d1117] rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 max-w-md mx-4">
          <div className="p-8 text-center">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 inline-flex mb-6">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Error Loading Community</h2>
            <p className="text-[#8b949e] mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              className="w-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:shadow-[0_8px_32px_rgba(88,166,255,0.2)]"
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
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 max-w-md mx-4">
          <div className="p-8 text-center">
            <div className="p-4 rounded-full bg-[#8b949e]/10 border border-[#8b949e]/20 inline-flex mb-6">
              <Users className="w-8 h-8 text-[#8b949e]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Community Not Found</h2>
            <p className="text-[#8b949e] mb-6">c/{communityName} doesn't exist yet.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/create-community">
                <Button variant="primary" className="w-full sm:w-auto bg-gradient-to-r from-[#58a6ff] to-[#a371f7]">
                  Create Community
                </Button>
              </Link>
              <Link to="/communities">
                <Button variant="secondary" className="w-full sm:w-auto bg-[#161b22]/60 border border-white/10 text-[#c9d1d9]">
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


  return (
    <>
      <SkipToContent targetId="community-main-content" />

      <div className="min-h-screen bg-[#0d1117]">
        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-yellow-900/50 border-b border-yellow-700/50 px-4 py-2 text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">You're offline. Viewing cached content.</span>
            </div>
          </div>
        )}

        {/* Community Header */}
        <div className="bg-[#161b22]/60 backdrop-blur-xl border-b border-white/10">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Community Icon */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
                  {community?.displayName?.[0]?.toUpperCase() || 'C'}
                </div>

                {/* Community Info */}
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    c/{community?.displayName}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-[#8b949e]">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {community?.memberCount?.toLocaleString()} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {community?.onlineCount} online
                    </span>
                    {community?.trending && (
                      <span className="flex items-center gap-1 text-[#58a6ff]">
                        <TrendingUp className="w-4 h-4" />
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
                className={`flex items-center gap-2 ${
                  isJoined
                    ? 'bg-[#161b22]/60 border border-white/10 text-[#c9d1d9] hover:bg-[#161b22]'
                    : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:shadow-[0_8px_32px_rgba(88,166,255,0.2)]'
                }`}
                aria-label={isJoined ? `Leave ${community?.displayName}` : `Join ${community?.displayName}`}
              >
                {isJoined ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Joined
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Join Community
                  </>
                )}
              </Button>
            </div>

            {/* Community Description */}
            {community?.description && (
              <p className="mt-4 text-[#c9d1d9] max-w-3xl">{community.description}</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="community-main-content">
            {/* Posts Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post Button/Form */}
              {isJoined && (
                <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
                  {!showPostForm ? (
                    <button
                      onClick={handleTogglePostForm}
                      className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-left text-[#8b949e] hover:text-white hover:bg-[#161b22] hover:border-[#58a6ff]/30 transition-all flex items-center gap-3"
                    >
                      <Plus className="w-5 h-5" />
                      Create a post
                    </button>
                  ) : (
                    <form onSubmit={handleCreatePost} className="space-y-4">
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
                          className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8b949e] focus:border-[#58a6ff]/50 focus:outline-none"
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
                          className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8b949e] min-h-32 focus:border-[#58a6ff]/50 focus:outline-none"
                          required
                        />
                      </AccessibleFormField>

                      <div className="flex gap-2">
                        <Button type="submit" variant="primary" className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:shadow-[0_8px_32px_rgba(88,166,255,0.2)]">
                          Post
                        </Button>
                        <Button type="button" variant="secondary" onClick={handleCancelPost} className="bg-[#161b22]/60 border border-white/10 text-[#c9d1d9]">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Sort Controls */}
              <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sortOptions.map((option) => {
                    const Icon = option.icon
                    const isActive = sortBy === option.id
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSortChange(option.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                          isActive
                            ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                            : 'bg-[#0d1117] border border-white/10 text-[#8b949e] hover:text-white hover:border-[#58a6ff]/30'
                        }`}
                        aria-pressed={isActive}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Posts List */}
              <div className="space-y-4">
                {sortedPosts.length === 0 ? (
                  <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-[#8b949e] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                    <p className="text-[#8b949e]">Be the first to post in this community!</p>
                  </div>
                ) : (
                  sortedPosts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex gap-4">
                          {/* Vote Section */}
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => handleVote(post.id, 'up')}
                              className={`p-1 rounded hover:bg-[#161b22] transition-colors ${
                                userVotes[post.id] === 'up' ? 'text-[#58a6ff]' : 'text-[#8b949e]'
                              }`}
                              aria-label={`Upvote post: ${post.title}`}
                            >
                              <ChevronUp className="w-6 h-6" />
                            </button>
                            <span className={`text-sm font-bold ${
                              post.score > 0 ? 'text-[#58a6ff]' : post.score < 0 ? 'text-[#a371f7]' : 'text-[#8b949e]'
                            }`}>
                              {post.score}
                            </span>
                            <button
                              onClick={() => handleVote(post.id, 'down')}
                              className={`p-1 rounded hover:bg-[#161b22] transition-colors ${
                                userVotes[post.id] === 'down' ? 'text-[#a371f7]' : 'text-[#8b949e]'
                              }`}
                              aria-label={`Downvote post: ${post.title}`}
                            >
                              <ChevronDown className="w-6 h-6" />
                            </button>
                          </div>

                          {/* Post Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                {post.pinned && (
                                  <span className="inline-block px-2 py-1 bg-[#58a6ff]/10 text-[#58a6ff] text-xs rounded-lg mb-2 border border-[#58a6ff]/20 font-medium">
                                    Pinned
                                  </span>
                                )}
                                <Link
                                  to={`/posts/${post.id}`}
                                  className="block group"
                                >
                                  <h3 className="text-xl font-semibold text-white group-hover:text-[#58a6ff] transition-colors mb-2">
                                    {post.title}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-2 text-sm text-[#8b949e] mb-3">
                                  <span>Posted by u/{post.author}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(post.created)}</span>
                                </div>
                              </div>
                            </div>

                            {post.content && (
                              <p className="text-[#c9d1d9] mb-4 line-clamp-3">{post.content}</p>
                            )}

                            {/* Post Actions */}
                            <div className="flex items-center gap-4 text-sm">
                              <Link
                                to={`/posts/${post.id}`}
                                className="flex items-center gap-2 text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>{post.comments} comments</span>
                              </Link>
                              <button className="flex items-center gap-2 text-[#8b949e] hover:text-[#58a6ff] transition-colors">
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                              </button>
                              <button className="flex items-center gap-2 text-[#8b949e] hover:text-[#58a6ff] transition-colors">
                                <Bookmark className="w-4 h-4" />
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
            <div className="space-y-6">
              {/* About Community */}
              <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
                <h2 className="text-lg font-bold text-white mb-4">About Community</h2>
                <div className="space-y-4">
                  {communityStats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#8b949e]">
                          <Icon className="w-4 h-4" />
                          <span>{stat.label}</span>
                        </div>
                        <span className="text-white font-semibold">{stat.value}</span>
                      </div>
                    )
                  })}
                  {community?.createdAt && (
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 text-[#8b949e]">
                        <Calendar className="w-4 h-4" />
                        <span>Created</span>
                      </div>
                      <span className="text-white font-semibold">
                        {new Date(community.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Community Rules */}
              {displayRules.length > 0 && (
                <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#58a6ff]" />
                    Rules
                  </h2>
                  <ol className="space-y-3">
                    {displayRules.map((rule, index) => (
                      <li key={index} className="text-sm text-[#c9d1d9] flex gap-3">
                        <span className="text-[#8b949e] font-semibold">{index + 1}.</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Moderators */}
              {displayModerators.length > 0 && (
                <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Moderators</h2>
                  <div className="space-y-2">
                    {displayModerators.map((mod, index) => (
                      <Link
                        key={index}
                        to={`/user/${mod}`}
                        className="flex items-center gap-2 text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
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
