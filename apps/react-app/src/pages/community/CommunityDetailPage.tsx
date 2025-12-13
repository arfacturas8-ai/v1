import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Users,
  Plus,
  TrendingUp,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Share2,
  Bookmark,
  MoreHorizontal,
  Calendar,
  Shield,
  Clock,
  Eye,
  Star,
  Flame,
  Zap,
  CheckCircle,
  UserPlus,
  Settings,
  Image as ImageIcon,
  Video,
  Bell,
  BellOff,
  Flag,
  X,
  Loader,
  Hash
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import communityService from '../../services/communityService'
import postsService from '../../services/postsService'

interface Community {
  id: string
  name: string
  displayName: string
  description: string
  icon?: string
  banner?: string
  category: string
  memberCount: number
  onlineCount?: number
  postCount?: number
  isMember?: boolean
  isOwner?: boolean
  isModerator?: boolean
  rules?: string[]
  moderators?: Array<{ username: string; role: string }>
  createdAt: string
  settings?: {
    allowPosts?: boolean
    requireApproval?: boolean
  }
}

interface Post {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  created: string
  upvotes: number
  downvotes: number
  score: number
  comments: number
  pinned?: boolean
  userVote?: 'up' | 'down' | null
}

const CommunityDetailPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('feed')
  const [sortBy, setSortBy] = useState('hot')
  const [showPostForm, setShowPostForm] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', type: 'text' })
  const [postSubmitting, setPostSubmitting] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)

  const tabs = [
    { id: 'feed', label: 'Feed', icon: Flame },
    { id: 'about', label: 'About', icon: Users },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'media', label: 'Media', icon: ImageIcon }
  ]

  const sortOptions = [
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Clock },
    { id: 'top', label: 'Top', icon: TrendingUp },
    { id: 'rising', label: 'Rising', icon: Zap }
  ]

  useEffect(() => {
    if (communityName) {
      loadCommunity()
    }
  }, [communityName])

  useEffect(() => {
    if (community && selectedTab === 'feed') {
      loadPosts()
    }
  }, [community, sortBy, selectedTab])

  const loadCommunity = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await communityService.getCommunityByName(communityName!)

      if (result.success && result.community) {
        setCommunity(result.community)
      } else {
        setError('Community not found')
      }
    } catch (err: any) {
      console.error('Error loading community:', err)
      setError(getErrorMessage(err, 'Failed to load community'))
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    if (!community) return

    try {
      const result = await postsService.getPosts({
        communityId: community.id,
        sort: sortBy,
        limit: 20
      })

      if (result.success && result.posts) {
        setPosts(result.posts)
      }
    } catch (err) {
      console.error('Error loading posts:', err)
    }
  }

  const handleJoinLeave = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!community) return

    try {
      if (community.isMember) {
        await communityService.leaveCommunity(community.id)
        setCommunity({ ...community, isMember: false, memberCount: Math.max(0, community.memberCount - 1) })
      } else {
        await communityService.joinCommunity(community.id)
        setCommunity({ ...community, isMember: true, memberCount: community.memberCount + 1 })
      }
    } catch (err) {
      console.error('Error joining/leaving community:', err)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !community) {
      navigate('/login')
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      return
    }

    setPostSubmitting(true)
    try {
      const result = await postsService.createPost({
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        communityId: community.id,
        type: newPost.type
      })

      if (result.success && result.post) {
        setPosts([result.post, ...posts])
        setNewPost({ title: '', content: '', type: 'text' })
        setShowPostForm(false)
      }
    } catch (err) {
      console.error('Error creating post:', err)
    } finally {
      setPostSubmitting(false)
    }
  }

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!user) {
      navigate('/login')
      return
    }

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post

        const currentVote = post.userVote
        let newVote: 'up' | 'down' | null = voteType

        if (currentVote === voteType) {
          newVote = null
        }

        let upvotes = post.upvotes
        let downvotes = post.downvotes

        if (currentVote === 'up') upvotes--
        else if (currentVote === 'down') downvotes--

        if (newVote === 'up') upvotes++
        else if (newVote === 'down') downvotes++

        return {
          ...post,
          upvotes,
          downvotes,
          score: upvotes - downvotes,
          userVote: newVote
        }
      })
    )

    try {
      await postsService.votePost(postId, voteType)
    } catch (err) {
      console.error('Error voting:', err)
      loadPosts()
    }
  }

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      switch (sortBy) {
        case 'hot':
          if (a.pinned && !b.pinned) return -1
          if (!a.pinned && b.pinned) return 1
          return b.score + b.comments * 0.5 - (a.score + a.comments * 0.5)
        case 'new':
          return new Date(b.created).getTime() - new Date(a.created).getTime()
        case 'top':
          return b.score - a.score
        case 'rising':
          const aAge = (Date.now() - new Date(a.created).getTime()) / (1000 * 60 * 60)
          const bAge = (Date.now() - new Date(b.created).getTime()) / (1000 * 60 * 60)
          return b.score / Math.max(bAge, 1) - a.score / Math.max(aAge, 1)
        default:
          return 0
      }
    })
  }, [posts, sortBy])

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)]">
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader className="w-12 h-12 text-[#58a6ff]  mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Loading community...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)]">
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-12 text-center max-w-md shadow-lg">
              <Hash size={56} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Community Not Found</h3>
              <p className="text-[var(--text-secondary)] mb-6">{error || 'This community does not exist.'}</p>
              <button
                onClick={() => navigate('/communities')}
                className="px-8 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all"
              >
                Browse Communities
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)]">
      {/* Banner */}
      {community.banner && (
        <div className="h-48 sm:h-64 overflow-hidden">
          <img src={community.banner} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <div className={`${community.banner ? '-mt-16' : ''}`}>
              {community.icon ? (
                <img
                  src={community.icon}
                  alt=""
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-[var(--bg-primary)] shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold border-4 border-[var(--bg-primary)] shadow-lg">
                  {community.displayName[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1">
                {community.displayName}
              </h1>
              <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-2">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {formatNumber(community.memberCount)} members
                </span>
                {community.onlineCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {formatNumber(community.onlineCount)} online
                  </span>
                )}
              </div>
              {community.description && (
                <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-2xl">
                  {community.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleJoinLeave}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  community.isMember
                    ? 'bg-gray-100 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-gray-200'
                    : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:shadow-[0_0_20px_rgba(88,166,255,0.4)]'
                }`}
              >
                {community.isMember ? (
                  <>
                    <CheckCircle size={16} />
                    Joined
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Join
                  </>
                )}
              </button>

              {(community.isOwner || community.isModerator) && (
                <button
                  onClick={() => navigate(`/community/${communityName}/settings`)}
                  className="p-3 bg-gray-100 border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] hover:bg-gray-200 transition-all"
                >
                  <Settings size={18} />
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="p-3 bg-gray-100 border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] hover:bg-gray-200 transition-all"
                >
                  <MoreHorizontal size={18} />
                </button>
                {showOptionsMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowOptionsMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-[var(--border-subtle)] rounded-xl shadow-lg z-20 overflow-hidden">
                      <button className="w-full px-4 py-3 text-left text-[var(--text-primary)] hover:bg-gray-50 transition-all flex items-center gap-2">
                        <Share2 size={16} />
                        Share
                      </button>
                      <button className="w-full px-4 py-3 text-left text-[var(--text-primary)] hover:bg-gray-50 transition-all flex items-center gap-2">
                        {community.isMember ? <BellOff size={16} /> : <Bell size={16} />}
                        {community.isMember ? 'Mute' : 'Notifications'}
                      </button>
                      <button className="w-full px-4 py-3 text-left text-red-500 hover:bg-gray-50 transition-all flex items-center gap-2">
                        <Flag size={16} />
                        Report
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = selectedTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'text-[var(--text-primary)] border-b-2 border-[#58a6ff]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTab === 'feed' && (
              <>
                {/* Post Composer */}
                {community.isMember && (
                  <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
                    {!showPostForm ? (
                      <button
                        onClick={() => setShowPostForm(true)}
                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-50 hover:border-[#58a6ff]/30 transition-all flex items-center gap-3"
                      >
                        <Plus size={20} />
                        Create a post
                      </button>
                    ) : (
                      <form onSubmit={handleCreatePost} className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create Post</h3>
                          <button
                            type="button"
                            onClick={() => setShowPostForm(false)}
                            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-gray-50 transition-all"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={newPost.title}
                          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                          placeholder="Post title..."
                          className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[#58a6ff]/50 transition-all"
                          required
                        />

                        <textarea
                          value={newPost.content}
                          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                          placeholder="What's on your mind?"
                          rows={4}
                          className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[#58a6ff]/50 resize-none transition-all"
                          required
                        />

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={postSubmitting}
                            className="px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Post
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPostForm(false)}
                            className="px-6 py-3 bg-gray-100 border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] hover:bg-gray-200 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Sort Controls */}
                <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-2 overflow-x-auto">
                    {sortOptions.map((option) => {
                      const Icon = option.icon
                      const isActive = sortBy === option.id
                      return (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                              : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#58a6ff]/30'
                          }`}
                        >
                          <Icon size={16} />
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Posts */}
                <div className="space-y-4">
                  {sortedPosts.length === 0 ? (
                    <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-12 text-center shadow-sm">
                      <MessageSquare size={56} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No posts yet</h3>
                      <p className="text-[var(--text-secondary)]">Be the first to post in this community!</p>
                    </div>
                  ) : (
                    sortedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm hover:border-[#58a6ff]/30 transition-all"
                      >
                        <div className="flex gap-4">
                          {/* Vote Section */}
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => handleVote(post.id, 'up')}
                              className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                                post.userVote === 'up' ? 'text-[#58a6ff]' : 'text-[var(--text-secondary)]'
                              }`}
                            >
                              <ChevronUp size={20} />
                            </button>
                            <span
                              className={`text-sm font-bold ${
                                post.score > 0
                                  ? 'text-[#58a6ff]'
                                  : post.score < 0
                                  ? 'text-[#a371f7]'
                                  : 'text-[var(--text-secondary)]'
                              }`}
                            >
                              {post.score}
                            </span>
                            <button
                              onClick={() => handleVote(post.id, 'down')}
                              className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                                post.userVote === 'down' ? 'text-[#a371f7]' : 'text-[var(--text-secondary)]'
                              }`}
                            >
                              <ChevronDown size={20} />
                            </button>
                          </div>

                          {/* Post Content */}
                          <div className="flex-1">
                            {post.pinned && (
                              <span className="inline-block px-2 py-1 bg-[#58a6ff]/10 text-[#58a6ff] text-xs rounded-lg mb-2 border border-[#58a6ff]/20 font-medium">
                                Pinned
                              </span>
                            )}
                            <Link
                              to={`/post/${post.id}`}
                              className="block group"
                            >
                              <h3 className="text-xl font-semibold text-[var(--text-primary)] group-hover:text-[#58a6ff] transition-colors mb-2">
                                {post.title}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
                              <span>Posted by u/{post.author}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(post.created)}</span>
                            </div>

                            {post.content && (
                              <p className="text-[var(--text-secondary)] mb-4 line-clamp-3">{post.content}</p>
                            )}

                            <div className="flex items-center gap-4 text-sm">
                              <Link
                                to={`/post/${post.id}`}
                                className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[#58a6ff] transition-colors"
                              >
                                <MessageSquare size={16} />
                                <span>{post.comments} comments</span>
                              </Link>
                              <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[#58a6ff] transition-colors">
                                <Share2 size={16} />
                                <span>Share</span>
                              </button>
                              <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[#58a6ff] transition-colors">
                                <Bookmark size={16} />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {selectedTab === 'about' && (
              <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">About</h2>
                <p className="text-[var(--text-secondary)] mb-6">{community.description}</p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                    <Calendar size={18} />
                    <span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                    <Users size={18} />
                    <span>{formatNumber(community.memberCount)} members</span>
                  </div>
                  {community.postCount !== undefined && (
                    <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <MessageSquare size={18} />
                      <span>{formatNumber(community.postCount)} posts</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'members' && (
              <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Members</h2>
                  <button
                    onClick={() => navigate(`/community/${communityName}/members`)}
                    className="text-[#58a6ff] hover:text-[#a371f7] text-sm font-semibold"
                  >
                    View All
                  </button>
                </div>
                <p className="text-[var(--text-secondary)]">
                  {formatNumber(community.memberCount)} members
                </p>
              </div>
            )}

            {selectedTab === 'events' && (
              <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-12 text-center shadow-sm">
                <Calendar size={56} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No events yet</h3>
                <p className="text-[var(--text-secondary)]">Check back later for community events.</p>
              </div>
            )}

            {selectedTab === 'media' && (
              <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-12 text-center shadow-sm">
                <ImageIcon size={56} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No media yet</h3>
                <p className="text-[var(--text-secondary)]">Media shared in this community will appear here.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rules */}
            {community.rules && community.rules.length > 0 && (
              <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-[#58a6ff]" />
                  Community Rules
                </h2>
                <ol className="space-y-3">
                  {community.rules.map((rule, index) => (
                    <li key={index} className="text-sm text-[var(--text-secondary)] flex gap-3">
                      <span className="text-[var(--text-secondary)] font-semibold">{index + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Moderators */}
            {community.moderators && community.moderators.length > 0 && (
              <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Moderators</h2>
                <div className="space-y-2">
                  {community.moderators.map((mod, index) => (
                    <Link
                      key={index}
                      to={`/user/${mod.username}`}
                      className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[#58a6ff] transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        {mod.username[0].toUpperCase()}
                      </div>
                      <span>u/{mod.username}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityDetailPage
