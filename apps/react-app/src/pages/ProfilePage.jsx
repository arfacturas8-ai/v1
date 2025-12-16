import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  User, Users, MessageSquare, Star, Trophy, Calendar, MapPin,
  Link as LinkIcon, Mail, UserPlus, UserMinus, Edit3,
  Award, Bookmark, Share2,
  ChevronUp, ChevronDown, Zap, Crown, Shield, Image,
  Wallet, Copy, CheckCircle, ExternalLink, Grid3x3, Activity, X, BarChart3
} from 'lucide-react'
import { Button, Input } from '../components/ui'
import { SkeletonProfile, SkeletonPost } from '../components/ui/SkeletonLoader'
import { EmptyPosts } from '../components/ui/EmptyState'
import usePullToRefresh from '../hooks/usePullToRefresh.jsx'
import SocialAnalytics from '../components/social/SocialAnalytics'
import SocialActivityFeed from '../components/social/SocialActivityFeed'
import SocialGraphVisualization from '../components/social/SocialGraphVisualization'
import { useAuth } from '../contexts/AuthContext'
import userService from '../services/userService'
import postsService from '../services/postsService'
import nftService from '../services/nftService'
import {
  SkipToContent,
  announce,
  useLoadingAnnouncement,
  useErrorAnnouncement,
  AccessibleModal,
  AccessibleTabs,
  useFocusTrap
} from '../utils/accessibility.jsx'
import { useResponsive } from '../hooks/useResponsive'

function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { isMobile, isTablet } = useResponsive()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [nfts, setNfts] = useState([])
  const [activities, setActivities] = useState([])
  const [activeTab, setActiveTab] = useState('posts')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: ''
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Accessibility: Announce loading and error states to screen readers
  useLoadingAnnouncement(loading, `Loading ${username || 'user'} profile`)
  useErrorAnnouncement(error)

  // Removed all mock data - using real API calls

  const loadProfileData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const targetUsername = username || currentUser?.username

      if (!targetUsername) {
        navigate('/login')
        return
      }

      // Check if viewing own profile
      setIsOwnProfile(targetUsername === currentUser?.username)

      // Fetch user profile data from API
      const userResponse = await userService.getUserProfile(targetUsername)

      if (!userResponse.success || !userResponse.user) {
        setError('User not found')
        setLoading(false)
        return
      }

      setUser(userResponse.user)
      setIsFollowing(userResponse.user.isFollowing || false)

      // Fetch user's posts, NFTs, and activities in parallel
      const [postsResponse, nftsResponse] = await Promise.all([
        postsService.getPosts({ authorId: userResponse.user.id, limit: 20 }),
        nftService.getMyNFTs(userResponse.user.id).catch(() => ({ success: false, nfts: [] }))
      ])

      if (postsResponse.success) {
        setPosts(postsResponse.posts || [])
      }

      if (nftsResponse.success) {
        setNfts(nftsResponse.nfts || nftsResponse.data || [])
      }

      // Comments, followers, following would come from additional API calls
      // For now, set empty arrays - implement when backend endpoints are ready
      setComments([])
      setFollowers([])
      setFollowing([])
      setSavedPosts([])
      setActivities([])

    } catch (error) {
      console.error('Error loading profile:', error)
      setError(error.message || 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }, [username, currentUser, navigate])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  // Pull-to-refresh for posts section
  const { isRefreshing } = usePullToRefresh({
    onRefresh: loadProfileData,
    enabled: activeTab === 'posts'
  })

  // Memoize scroll handler for parallax effect
  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY)
  }, [])

  // Parallax scroll effect
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Initialize edit form when modal opens
  useEffect(() => {
    if (showEditModal && user) {
      setEditFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || ''
      })
      setSaveError(null)
      setSaveSuccess(false)
    }
  }, [showEditModal, user])

  // Memoize callback functions
  const formatTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }, [])

  const handleFollow = useCallback(() => {
    setIsFollowing(!isFollowing)
    setUser({
      ...user,
      followerCount: isFollowing ? (user?.followerCount || 0) - 1 : (user?.followerCount || 0) + 1
    })
  }, [isFollowing, user])

  const getBadgeIcon = useCallback((iconName) => {
    switch (iconName) {
      case 'shield': return Shield
      case 'crown': return Crown
      case 'star': return Star
      case 'users': return Users
      default: return Trophy
    }
  }, [])

  const copyWalletAddress = useCallback(() => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }, [user?.walletAddress])

  const getRarityColor = useCallback((rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-500'
      case 'epic': return 'from-purple-400 via-pink-500 to-red-500'
      case 'rare': return 'from-blue-400 via-cyan-500 to-teal-500'
      default: return 'from-gray-400 via-gray-500 to-gray-600'
    }
  }, [])

  const handleEditFormChange = useCallback((field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleSave = useCallback(async () => {
    setSaveLoading(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Validate form data
      if (!editFormData.displayName || editFormData.displayName.trim().length === 0) {
        setSaveError('Display name is required')
        setSaveLoading(false)
        return
      }

      if (editFormData.displayName.trim().length < 2) {
        setSaveError('Display name must be at least 2 characters')
        setSaveLoading(false)
        return
      }

      if (editFormData.displayName.trim().length > 50) {
        setSaveError('Display name must be less than 50 characters')
        setSaveLoading(false)
        return
      }

      if (editFormData.bio && editFormData.bio.length > 500) {
        setSaveError('Bio must be less than 500 characters')
        setSaveLoading(false)
        return
      }

      if (editFormData.website && editFormData.website.trim().length > 0) {
        const urlPattern = /^https?:\/\/.+/i
        if (!urlPattern.test(editFormData.website)) {
          setSaveError('Website must be a valid URL starting with http:// or https://')
          setSaveLoading(false)
          return
        }
      }

      // Prepare data for API
      const updateData = {
        displayName: editFormData.displayName.trim(),
        bio: editFormData.bio?.trim() || '',
        location: editFormData.location?.trim() || '',
        website: editFormData.website?.trim() || ''
      }

      // Call API to update profile
      const response = await userService.updateProfile(updateData)

      if (response.success) {
        // Update local user state with new data
        setUser(prev => ({
          ...prev,
          ...updateData
        }))

        setSaveSuccess(true)

        // Close modal after short delay to show success
        setTimeout(() => {
          setShowEditModal(false)
          setSaveSuccess(false)
        }, 1500)
      } else {
        setSaveError(response.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveError(error.message || 'An error occurred while updating your profile')
    } finally {
      setSaveLoading(false)
    }
  }, [editFormData])

  // Memoize filtered and sorted posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => post !== null && post !== undefined)
  }, [posts])

  // Memoize sorted posts by creation date
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => new Date(b.created) - new Date(a.created))
  }, [filteredPosts])

  // Memoize user stats data
  const userStatsData = useMemo(() => {
    if (!user) return []
    return [
      { label: 'Posts', value: user?.stats?.totalPosts || 0, icon: MessageSquare, color: 'from-[#58a6ff] to-[#a371f7]' },
      { label: 'Karma', value: (user?.karma || 0).toLocaleString(), icon: Zap, color: 'from-[#58a6ff] to-[#a371f7]' },
      { label: 'Followers', value: (user?.followerCount || 0).toLocaleString(), icon: Users, color: 'from-[#58a6ff] to-[#a371f7]' },
      { label: 'NFTs', value: user?.nftCount || 0, icon: Image, color: 'from-[#58a6ff] to-[#a371f7]' },
      { label: 'Awards', value: user?.stats?.totalAwards || 0, icon: Trophy, color: 'from-[#58a6ff] to-[#a371f7]' }
    ]
  }, [user])

  // Memoize tab configuration
  const tabs = useMemo(() => [
    {id: 'posts', label: 'Posts', icon: MessageSquare, count: user?.stats?.totalPosts},
    {id: 'comments', label: 'Comments', icon: MessageSquare, count: user?.stats?.totalComments},
    {id: 'saved', label: 'Saved', icon: Bookmark, count: savedPosts?.length},
    {id: 'about', label: 'About', icon: User}
  ], [user, savedPosts])

  // Memoize badge list display
  const displayedBadges = useMemo(() => {
    return user?.badges?.slice(0, 2) || []
  }, [user?.badges])

  // Memoize filtered NFTs
  const displayNfts = useMemo(() => {
    return nfts.filter(nft => nft !== null && nft !== undefined)
  }, [nfts])

  // Memoize filtered activities
  const displayActivities = useMemo(() => {
    return activities.filter(activity => activity !== null && activity !== undefined)
  }, [activities])

  // Memoize event handlers
  const handleShowEditModal = useCallback(() => {
    setShowEditModal(true)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false)
  }, [])

  const handleShowMessageModal = useCallback(() => {
    setShowMessageModal(true)
  }, [])

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId)
  }, [])

  const handleShare = useCallback(() => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: `${user?.displayName || user?.username}'s Profile`,
        url: url
      })
    } else {
      navigator.clipboard.writeText(url)
      announce('Profile link copied to clipboard')
    }
  }, [user])


  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="bg-white rounded-2xl shadow-lg border max-w-md mx-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="p-8 text-center">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 inline-flex mb-6">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Error Loading Profile</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={loadProfileData} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]">Try Again</Button>
              <Link to="/">
                <Button variant="secondary" className="bg-white border" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>Go Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="bg-white rounded-2xl shadow-lg border max-w-md mx-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="p-8 text-center">
            <div className="p-4 rounded-full border inline-flex mb-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
              <User className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>User not found</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">The user you're looking for doesn't exist or has been deleted.</p>
            <Link to="/">
              <Button variant="primary" className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Profile page">
      <SkipToContent />

      {/* Header Section with Banner */}
      <div className="relative">
        {/* Banner Image with Parallax */}
        <div
          className="h-64 md:h-80 bg-gradient-to-br from-[#58a6ff] via-[#a371f7] to-[#58a6ff] relative overflow-hidden"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            backgroundImage: user.bannerImage ? `url(${user.bannerImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t to-transparent" style={{ backgroundImage: 'linear-gradient(to top, var(--bg-primary), transparent)' }}></div>
        </div>

        {/* Profile Content */}
        <div className="container mx-auto px-4 -mt-24 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl border p-6 shadow-lg" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 shadow-xl" style={{ borderColor: 'var(--bg-primary)' }}>
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.displayName || user.username}'s avatar`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#58a6ff] to-[#a371f7]">
                        <User style={{color: "var(--text-primary)"}} className="w-16 h-16 " />
                      </div>
                    )}
                  </div>
                  {user.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-[#58a6ff] rounded-full p-1.5 border-2 shadow-lg" style={{ borderColor: 'var(--bg-primary)' }}>
                      <CheckCircle style={{color: "var(--text-primary)"}} className="w-5 h-5 " />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        {user.displayName || user.username}
                        {displayedBadges.map((badge, idx) => {
                          const BadgeIcon = getBadgeIcon(badge.icon)
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-lg bg-[#58a6ff]/10 border border-[#58a6ff]/20"
                              title={badge.name}
                            >
                              <BadgeIcon className="w-4 h-4 text-[#58a6ff]" />
                            </span>
                          )
                        })}
                      </h1>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>@{user.username}</p>
                      {user.bio && (
                        <p className="mb-3 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>{user.bio}</p>
                      )}

                      {/* User Meta Info */}
                      <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {user.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        {user.website && (
                          <a
                            href={user.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-[#58a6ff] transition-colors"
                          >
                            <LinkIcon className="w-4 h-4" />
                            <span>{user.website.replace(/^https?:\/\//, '')}</span>
                          </a>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {isOwnProfile ? (
                        <button
                          onClick={handleShowEditModal}
                          className="touch-target px-4 py-2 bg-white hover:bg-white border rounded-xl font-medium transition-all flex items-center gap-2"
                          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                          aria-label="Edit profile"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleFollow}
                            className={`touch-target px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                              isFollowing
                                ? 'bg-white hover:bg-white border'
                                : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:shadow-lg text-white'
                            }`}
                            style={isFollowing ? { borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' } : {}}
                            aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
                          >
                            {isFollowing ? (
                              <>
                                <UserMinus className="w-4 h-4" />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                Follow
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleShowMessageModal}
                            className="touch-target px-4 py-2 bg-white hover:bg-white border rounded-xl font-medium transition-all flex items-center gap-2"
                            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                            aria-label="Send message"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleShare}
                        className="touch-target px-4 py-2 bg-white hover:bg-white border rounded-xl font-medium transition-all flex items-center gap-2"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                        aria-label="Share profile"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    {userStatsData.map((stat, idx) => {
                      const StatIcon = stat.icon
                      return (
                        <div key={idx} className="text-center">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`p-1.5 rounded-lg bg-gradient-to-r ${stat.color} bg-opacity-20`}>
                              <StatIcon className="w-4 h-4 text-[#58a6ff]" />
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
                          </div>
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="border-b mb-6" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`touch-target px-4 py-3 font-medium transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
                      activeTab === tab.id
                        ? 'text-[#58a6ff] border-[#58a6ff]'
                        : 'border-transparent'
                    }`}
                    style={activeTab !== tab.id ? { color: 'var(--text-secondary)' } : {}}
                    aria-label={`View ${tab.label}`}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="text-xs px-2 py-0.5 bg-white rounded-full border" style={{ borderColor: 'var(--border-subtle)' }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {sortedPosts.length > 0 ? (
                    sortedPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        className="block bg-white border rounded-2xl shadow-sm p-6 hover:border-[#58a6ff]/30 hover:shadow-md transition-all group"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold group-hover:text-[#58a6ff] transition-colors mb-2" style={{ color: 'var(--text-primary)' }}>
                              {post.title}
                            </h3>
                            {post.content && (
                              <p className="line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
                                {post.content.substring(0, 200)}...
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              <div className="flex items-center gap-1">
                                <ChevronUp className="w-4 h-4" />
                                <span>{post.upvotes || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                <span>{post.commentCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                <span>{post.awardCount || 0}</span>
                              </div>
                              <span>{formatTimeAgo(post.created)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <EmptyPosts isOwnProfile={isOwnProfile} />
                  )}
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-white border rounded-2xl shadow-sm p-6"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>
                        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <div className="flex items-center gap-1">
                            <ChevronUp className="w-4 h-4" />
                            <span>{comment.upvotes || 0}</span>
                          </div>
                          <span>{formatTimeAgo(comment.created)}</span>
                          <Link to={`/post/${comment.postId}`} className="text-blue-400 hover:underline">
                            View post
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border rounded-2xl shadow-sm p-12 text-center" style={{ borderColor: 'var(--border-subtle)' }}>
                      <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>No comments yet</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {isOwnProfile ? "You haven't commented on any posts yet." : "This user hasn't commented on anything yet."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Saved Tab */}
              {activeTab === 'saved' && (
                <div className="space-y-4">
                  {savedPosts.length > 0 ? (
                    savedPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        className="block bg-white border rounded-2xl shadow-sm p-6 transition-all"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{post.title}</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Saved {formatTimeAgo(post.savedAt)}</p>
                      </Link>
                    ))
                  ) : (
                    <div className="bg-white border rounded-2xl shadow-sm p-12 text-center" style={{ borderColor: 'var(--border-subtle)' }}>
                      <Bookmark className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>No saved posts</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {isOwnProfile ? "You haven't saved any posts yet." : "This user hasn't saved any posts."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  {/* Bio Section */}
                  <div className="bg-white border rounded-2xl shadow-sm p-6" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <User className="w-5 h-5" />
                      About
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      {user?.bio || 'No bio provided.'}
                    </p>
                  </div>

                  {/* Social Links */}
                  {(user.socialLinks && Object.keys(user.socialLinks).length > 0) && (
                    <div className="bg-white border rounded-2xl shadow-sm p-6" style={{ borderColor: 'var(--border-subtle)' }}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <LinkIcon className="w-5 h-5" />
                        Social Links
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(user.socialLinks).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="capitalize">{platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wallet Address */}
                  {user.walletAddress && (
                    <div className="bg-white border rounded-2xl shadow-sm p-6" style={{ borderColor: 'var(--border-subtle)' }}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <Wallet className="w-5 h-5" />
                        Wallet Address
                      </h3>
                      <button
                        onClick={copyWalletAddress}
                        className="touch-target flex items-center gap-2 transition-colors font-mono text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span className="truncate">{user.walletAddress}</span>
                        {copiedAddress ? (
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <Copy className="w-4 h-4 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Badges/Achievements */}
              {user.badges && user.badges.length > 0 && (
                <div className="bg-white border rounded-2xl shadow-sm p-6" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Achievements
                  </h3>
                  <div className="space-y-3">
                    {user.badges.map((badge, idx) => {
                      const BadgeIcon = getBadgeIcon(badge.icon)
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 border rounded-xl hover:border-[#58a6ff]/30 transition-all"
                          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
                        >
                          <div className="p-2 rounded-lg bg-gradient-to-br from-[#58a6ff]/20 to-[#a371f7]/20">
                            <BadgeIcon className="w-5 h-5 text-[#58a6ff]" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{badge.name}</h4>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{badge.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Followers/Following */}
              <div className="bg-white border rounded-2xl shadow-sm p-6" style={{ borderColor: 'var(--border-subtle)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Users className="w-5 h-5" />
                  Connections
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {user.followerCount?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Followers</div>
                  </div>
                  <div className="text-center p-4 border rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {user.followingCount?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Following</div>
                  </div>
                </div>
              </div>

              {/* NFTs Preview */}
              {displayNfts.length > 0 && (
                <div className="bg-white border rounded-2xl shadow-sm p-6" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Image className="w-5 h-5" />
                    NFT Collection
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {displayNfts.slice(0, 4).map((nft, idx) => (
                      <div
                        key={idx}
                        style={{borderColor: "var(--border-subtle)"}} className="aspect-square rounded-lg overflow-hidden bg-[#1A1A1A] border  hover:border-blue-500 transition-all cursor-pointer group"
                      >
                        {nft.image ? (
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#58a6ff] to-[#a371f7]">
                            <Image style={{color: "var(--text-primary)"}} className="w-8 h-8 " />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {displayNfts.length > 4 && (
                    <button
                      onClick={() => handleTabChange('nfts')}
                      className="touch-target w-full mt-3 px-4 py-2 bg-white border rounded-xl text-sm font-medium transition-all"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      View all {displayNfts.length} NFTs
                    </button>
                  )}
                </div>
              )}

              {/* Activity Stats */}
              <div className="bg-white border rounded-2xl shadow-sm p-6" style={{ borderColor: 'var(--border-subtle)' }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Activity className="w-5 h-5" />
                  Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Karma</span>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{user.karma?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Posts Created</span>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{user.stats?.totalPosts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Comments Made</span>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{user.stats?.totalComments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Awards Received</span>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{user.stats?.totalAwards || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <AccessibleModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          title="Edit Profile"
        >
          <div className="bg-white rounded-2xl shadow-lg border p-6 max-w-2xl w-full mx-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Profile</h2>
              <button
                onClick={handleCloseEditModal}
                className="touch-target p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Display Name
                </label>
                <Input
                  type="text"
                  value={editFormData.displayName}
                  onChange={(e) => handleEditFormChange('displayName', e.target.value)}
                  placeholder="Your display name"
                  className="w-full bg-white border rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Bio
                </label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => handleEditFormChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={4}
                  className="w-full bg-white border rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none resize-none"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  maxLength={500}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {editFormData.bio?.length || 0}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Location
                </label>
                <Input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => handleEditFormChange('location', e.target.value)}
                  placeholder="Where are you from?"
                  className="w-full bg-white border rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Website
                </label>
                <Input
                  type="url"
                  value={editFormData.website}
                  onChange={(e) => handleEditFormChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-white border rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              {saveError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{saveError}</p>
                </div>
              )}

              {saveSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Profile updated successfully!
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  style={{color: "var(--text-primary)"}} className="touch-target flex-1 px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:shadow-lg disabled:opacity-50  rounded-xl font-medium transition-all"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCloseEditModal}
                  disabled={saveLoading}
                  className="touch-target px-4 py-2 bg-white border rounded-xl font-medium transition-all"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </AccessibleModal>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <AccessibleModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          title="Send Message"
        >
          <div className="bg-white rounded-2xl shadow-lg border p-6 max-w-2xl w-full mx-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Send Message to @{user.username}</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="touch-target p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Message
                </label>
                <textarea
                  placeholder="Type your message..."
                  rows={6}
                  className="w-full bg-white border rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none resize-none"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex gap-3">
                <button style={{color: "var(--text-primary)"}} className="touch-target flex-1 px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:shadow-lg  rounded-xl font-medium transition-all">
                  Send Message
                </button>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="touch-target px-4 py-2 bg-white border rounded-xl font-medium transition-all"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </AccessibleModal>
      )}
    </div>
  )
}

export default ProfilePage
