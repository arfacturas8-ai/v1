/**
 * CRYB Platform - Profile Page
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
      case 'legendary': return 'linear-gradient(135deg, #FBBF24 0%, #F97316 50%, #EF4444 100%)'
      case 'epic': return 'linear-gradient(135deg, #A78BFA 0%, #EC4899 50%, #EF4444 100%)'
      case 'rare': return 'linear-gradient(135deg, #60A5FA 0%, #06B6D4 50%, #14B8A6 100%)'
      default: return 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 50%, #4B5563 100%)'
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
      { label: 'Posts', value: user?.stats?.totalPosts || 0, icon: MessageSquare, color: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' },
      { label: 'Karma', value: (user?.karma || 0).toLocaleString(), icon: Zap, color: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' },
      { label: 'Followers', value: (user?.followerCount || 0).toLocaleString(), icon: Users, color: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' },
      { label: 'NFTs', value: user?.nftCount || 0, icon: Image, color: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' },
      { label: 'Awards', value: user?.stats?.totalAwards || 0, icon: Trophy, color: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAFA'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          maxWidth: '448px',
          margin: '0 16px',
          width: '100%'
        }}>
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{
              padding: '16px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'inline-flex',
              marginBottom: '24px'
            }}>
              <X style={{ width: '48px', height: '48px', color: '#EF4444' }} />
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#000000'
            }}>Error Loading Profile</h2>
            <p style={{
              color: '#666666',
              marginBottom: '24px',
              fontSize: '15px',
              lineHeight: '1.5'
            }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={loadProfileData}
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  fontWeight: '600',
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.35)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)'
                }}
              >Try Again</button>
              <Link to="/">
                <button style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  color: '#666666',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                >Go Home</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAFA'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          maxWidth: '448px',
          margin: '0 16px',
          width: '100%'
        }}>
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{
              padding: '16px',
              borderRadius: '50%',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              background: '#F5F5F5',
              display: 'inline-flex',
              marginBottom: '24px'
            }}>
              <User style={{ width: '48px', height: '48px', color: '#666666' }} />
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#000000'
            }}>User not found</h2>
            <p style={{
              color: '#666666',
              marginBottom: '24px',
              fontSize: '15px',
              lineHeight: '1.5'
            }}>The user you're looking for doesn't exist or has been deleted.</p>
            <Link to="/">
              <button style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '14px',
                fontWeight: '600',
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)'
              }}
              >Go Home</button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }} role="main" aria-label="Profile page">
      <SkipToContent />

      {/* Header Section with Banner */}
      <div style={{ position: 'relative' }}>
        {/* Banner Image with Parallax */}
        <div
          style={{
            height: isMobile ? '256px' : '320px',
            background: user.bannerImage ? `url(${user.bannerImage}) center/cover` : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #6366F1 100%)',
            position: 'relative',
            overflow: 'hidden',
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #FAFAFA, transparent)'
          }}></div>
        </div>

        {/* Profile Content */}
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px',
          marginTop: '-96px',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '24px',
                alignItems: 'flex-start'
              }}>
                {/* Avatar */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '128px',
                    height: '128px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '4px solid #FAFAFA',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                  }}>
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.displayName || user.username}'s avatar`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                      }}>
                        <User style={{ color: 'white', width: '64px', height: '64px' }} />
                      </div>
                    )}
                  </div>
                  {user.isVerified && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-8px',
                      right: '-8px',
                      background: '#6366F1',
                      borderRadius: '50%',
                      padding: '6px',
                      border: '2px solid #FAFAFA',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                    }}>
                      <CheckCircle style={{ color: 'white', width: '20px', height: '20px' }} />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <h1 style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#000000',
                        flexWrap: 'wrap'
                      }}>
                        {user.displayName || user.username}
                        {displayedBadges.map((badge, idx) => {
                          const BadgeIcon = getBadgeIcon(badge.icon)
                          return (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '14px',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.2)'
                              }}
                              title={badge.name}
                            >
                              <BadgeIcon style={{ width: '20px', height: '20px', color: '#6366F1' }} />
                            </span>
                          )
                        })}
                      </h1>
                      <p style={{
                        fontSize: '15px',
                        marginBottom: '12px',
                        color: '#666666'
                      }}>@{user.username}</p>
                      {user.bio && (
                        <p style={{
                          marginBottom: '12px',
                          maxWidth: '768px',
                          color: '#666666',
                          fontSize: '15px',
                          lineHeight: '1.5'
                        }}>{user.bio}</p>
                      )}

                      {/* User Meta Info */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
                        fontSize: '14px',
                        color: '#666666'
                      }}>
                        {user.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin style={{ width: '20px', height: '20px' }} />
                            <span>{user.location}</span>
                          </div>
                        )}
                        {user.website && (
                          <a
                            href={user.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#666666',
                              textDecoration: 'none',
                              transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#6366F1'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
                          >
                            <LinkIcon style={{ width: '20px', height: '20px' }} />
                            <span>{user.website.replace(/^https?:\/\//, '')}</span>
                          </a>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar style={{ width: '20px', height: '20px' }} />
                          <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {isOwnProfile ? (
                        <button
                          onClick={handleShowEditModal}
                          style={{
                            minHeight: '48px',
                            padding: '12px 16px',
                            background: 'white',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            borderRadius: '14px',
                            fontWeight: '600',
                            fontSize: '15px',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#666666',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                          aria-label="Edit profile"
                        >
                          <Edit3 style={{ width: '20px', height: '20px' }} />
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleFollow}
                            style={{
                              minHeight: '48px',
                              padding: '12px 16px',
                              background: isFollowing ? 'white' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                              border: isFollowing ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                              borderRadius: '14px',
                              fontWeight: '600',
                              fontSize: '15px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: isFollowing ? '#666666' : 'white',
                              cursor: 'pointer',
                              boxShadow: isFollowing ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.25)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)'
                              e.currentTarget.style.boxShadow = isFollowing ? '0 4px 12px rgba(0, 0, 0, 0.08)' : '0 8px 20px rgba(99, 102, 241, 0.35)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = isFollowing ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.25)'
                            }}
                            aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
                          >
                            {isFollowing ? (
                              <>
                                <UserMinus style={{ width: '20px', height: '20px' }} />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus style={{ width: '20px', height: '20px' }} />
                                Follow
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleShowMessageModal}
                            style={{
                              minHeight: '48px',
                              padding: '12px 16px',
                              background: 'white',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: '14px',
                              fontWeight: '600',
                              fontSize: '15px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#666666',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                            aria-label="Send message"
                          >
                            <Mail style={{ width: '20px', height: '20px' }} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleShare}
                        style={{
                          minHeight: '48px',
                          padding: '12px 16px',
                          background: 'white',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '14px',
                          fontWeight: '600',
                          fontSize: '15px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#666666',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                        aria-label="Share profile"
                      >
                        <Share2 style={{ width: '20px', height: '20px' }} />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                  }}>
                    {userStatsData.map((stat, idx) => {
                      const StatIcon = stat.icon
                      return (
                        <div key={idx} style={{ textAlign: 'center' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <div style={{
                              padding: '6px',
                              borderRadius: '12px',
                              background: stat.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <StatIcon style={{ width: '20px', height: '20px', color: 'white' }} />
                            </div>
                            <span style={{
                              fontSize: '24px',
                              fontWeight: '700',
                              color: '#000000'
                            }}>{stat.value}</span>
                          </div>
                          <span style={{
                            fontSize: '14px',
                            color: '#666666'
                          }}>{stat.label}</span>
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
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px 16px'
      }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          {/* Tabs */}
          <div style={{
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              gap: '4px',
              overflowX: 'auto'
            }}>
              {tabs.map((tab) => {
                const TabIcon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    style={{
                      minHeight: '48px',
                      padding: '12px 16px',
                      fontWeight: '600',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                      borderBottom: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
                      color: activeTab === tab.id ? '#6366F1' : '#666666',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                    aria-label={`View ${tab.label}`}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    <TabIcon style={{ width: '20px', height: '20px' }} />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span style={{
                        fontSize: '13px',
                        padding: '2px 8px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.06)'
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {/* Main Content Area */}
            <div style={{
              gridColumn: isMobile ? '1' : 'span 2'
            }}>
              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sortedPosts.length > 0 ? (
                    sortedPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        style={{
                          display: 'block',
                          background: 'white',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderRadius: '20px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          padding: '24px',
                          transition: 'all 0.2s ease',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)'
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              marginBottom: '8px',
                              color: '#000000',
                              transition: 'color 0.2s ease'
                            }}>
                              {post.title}
                            </h3>
                            {post.content && (
                              <p style={{
                                color: '#666666',
                                fontSize: '15px',
                                lineHeight: '1.5',
                                marginBottom: '12px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {post.content.substring(0, 200)}...
                              </p>
                            )}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              fontSize: '14px',
                              color: '#666666'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ChevronUp style={{ width: '20px', height: '20px' }} />
                                <span>{post.upvotes || 0}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MessageSquare style={{ width: '20px', height: '20px' }} />
                                <span>{post.commentCount || 0}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Award style={{ width: '20px', height: '20px' }} />
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          background: 'white',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderRadius: '20px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          padding: '24px'
                        }}
                      >
                        <p style={{
                          marginBottom: '12px',
                          color: '#666666',
                          fontSize: '15px',
                          lineHeight: '1.5'
                        }}>{comment.content}</p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          fontSize: '14px',
                          color: '#666666'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ChevronUp style={{ width: '20px', height: '20px' }} />
                            <span>{comment.upvotes || 0}</span>
                          </div>
                          <span>{formatTimeAgo(comment.created)}</span>
                          <Link
                            to={`/post/${comment.postId}`}
                            style={{
                              color: '#6366F1',
                              textDecoration: 'none',
                              transition: 'opacity 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            View post
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '20px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      padding: '48px',
                      textAlign: 'center'
                    }}>
                      <MessageSquare style={{ width: '64px', height: '64px', color: '#999999', margin: '0 auto 16px' }} />
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#666666'
                      }}>No comments yet</h3>
                      <p style={{ color: '#999999', fontSize: '15px' }}>
                        {isOwnProfile ? "You haven't commented on any posts yet." : "This user hasn't commented on anything yet."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Saved Tab */}
              {activeTab === 'saved' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {savedPosts.length > 0 ? (
                    savedPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        style={{
                          display: 'block',
                          background: 'white',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderRadius: '20px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          padding: '24px',
                          transition: 'all 0.2s ease',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}
                      >
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          marginBottom: '8px',
                          color: '#000000'
                        }}>{post.title}</h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#666666'
                        }}>Saved {formatTimeAgo(post.savedAt)}</p>
                      </Link>
                    ))
                  ) : (
                    <div style={{
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '20px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      padding: '48px',
                      textAlign: 'center'
                    }}>
                      <Bookmark style={{ width: '64px', height: '64px', color: '#999999', margin: '0 auto 16px' }} />
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#666666'
                      }}>No saved posts</h3>
                      <p style={{ color: '#999999', fontSize: '15px' }}>
                        {isOwnProfile ? "You haven't saved any posts yet." : "This user hasn't saved any posts."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Bio Section */}
                  <div style={{
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    padding: '24px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#000000'
                    }}>
                      <User style={{ width: '20px', height: '20px' }} />
                      About
                    </h3>
                    <p style={{
                      color: '#666666',
                      fontSize: '15px',
                      lineHeight: '1.5'
                    }}>
                      {user?.bio || 'No bio provided.'}
                    </p>
                  </div>

                  {/* Social Links */}
                  {(user.socialLinks && Object.keys(user.socialLinks).length > 0) && (
                    <div style={{
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '20px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      padding: '24px'
                    }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#000000'
                      }}>
                        <LinkIcon style={{ width: '20px', height: '20px' }} />
                        Social Links
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(user.socialLinks).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#6366F1',
                              textDecoration: 'none',
                              transition: 'opacity 0.2s ease',
                              fontSize: '15px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <ExternalLink style={{ width: '20px', height: '20px' }} />
                            <span style={{ textTransform: 'capitalize' }}>{platform}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wallet Address */}
                  {user.walletAddress && (
                    <div style={{
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '20px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      padding: '24px'
                    }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#000000'
                      }}>
                        <Wallet style={{ width: '20px', height: '20px' }} />
                        Wallet Address
                      </h3>
                      <button
                        onClick={copyWalletAddress}
                        style={{
                          minHeight: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          color: '#666666',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{user.walletAddress}</span>
                        {copiedAddress ? (
                          <CheckCircle style={{ width: '20px', height: '20px', color: '#10B981', flexShrink: 0 }} />
                        ) : (
                          <Copy style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Badges/Achievements */}
              {user.badges && user.badges.length > 0 && (
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  padding: '24px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#000000'
                  }}>
                    <Trophy style={{ width: '20px', height: '20px' }} />
                    Achievements
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {user.badges.map((badge, idx) => {
                      const BadgeIcon = getBadgeIcon(badge.icon)
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            borderRadius: '16px',
                            background: '#FAFAFA',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'
                            e.currentTarget.style.background = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                            e.currentTarget.style.background = '#FAFAFA'
                          }}
                        >
                          <div style={{
                            padding: '8px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <BadgeIcon style={{ width: '20px', height: '20px', color: '#6366F1' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{
                              fontWeight: '600',
                              fontSize: '14px',
                              color: '#000000'
                            }}>{badge.name}</h4>
                            <p style={{
                              fontSize: '13px',
                              color: '#666666'
                            }}>{badge.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Followers/Following */}
              <div style={{
                background: 'white',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#000000'
                }}>
                  <Users style={{ width: '20px', height: '20px' }} />
                  Connections
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    background: '#FAFAFA'
                  }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      marginBottom: '4px',
                      color: '#000000'
                    }}>
                      {user.followerCount?.toLocaleString() || 0}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666666'
                    }}>Followers</div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    background: '#FAFAFA'
                  }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      marginBottom: '4px',
                      color: '#000000'
                    }}>
                      {user.followingCount?.toLocaleString() || 0}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666666'
                    }}>Following</div>
                  </div>
                </div>
              </div>

              {/* NFTs Preview */}
              {displayNfts.length > 0 && (
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  padding: '24px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#000000'
                  }}>
                    <Image style={{ width: '20px', height: '20px' }} />
                    NFT Collection
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    {displayNfts.slice(0, 4).map((nft, idx) => (
                      <div
                        key={idx}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: '#1A1A1A',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#6366F1'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        {nft.image ? (
                          <img
                            src={nft.image}
                            alt={nft.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.2s ease'
                            }}
                            loading="lazy"
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                          }}>
                            <Image style={{ color: 'white', width: '48px', height: '48px' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {displayNfts.length > 4 && (
                    <button
                      onClick={() => handleTabChange('nfts')}
                      style={{
                        minHeight: '48px',
                        width: '100%',
                        marginTop: '12px',
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        color: '#666666',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      View all {displayNfts.length} NFTs
                    </button>
                  )}
                </div>
              )}

              {/* Activity Stats */}
              <div style={{
                background: 'white',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#000000'
                }}>
                  <Activity style={{ width: '20px', height: '20px' }} />
                  Activity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#666666'
                    }}>Total Karma</span>
                    <span style={{
                      fontWeight: '600',
                      color: '#000000'
                    }}>{user.karma?.toLocaleString() || 0}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#666666'
                    }}>Posts Created</span>
                    <span style={{
                      fontWeight: '600',
                      color: '#000000'
                    }}>{user.stats?.totalPosts || 0}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#666666'
                    }}>Comments Made</span>
                    <span style={{
                      fontWeight: '600',
                      color: '#000000'
                    }}>{user.stats?.totalComments || 0}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#666666'
                    }}>Awards Received</span>
                    <span style={{
                      fontWeight: '600',
                      color: '#000000'
                    }}>{user.stats?.totalAwards || 0}</span>
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
          <div style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '32px',
            maxWidth: '672px',
            width: '100%',
            margin: '0 16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#000000'
              }}>Edit Profile</h2>
              <button
                onClick={handleCloseEditModal}
                style={{
                  minHeight: '48px',
                  padding: '8px',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  color: '#666666',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F5F5F5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
                aria-label="Close modal"
              >
                <X style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#000000'
                }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={editFormData.displayName}
                  onChange={(e) => handleEditFormChange('displayName', e.target.value)}
                  placeholder="Your display name"
                  style={{
                    width: '100%',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    color: '#000000',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    height: '52px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6366F1'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#000000'
                }}>
                  Bio
                </label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => handleEditFormChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={4}
                  maxLength={500}
                  style={{
                    width: '100%',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    color: '#000000',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6366F1'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <p style={{
                  fontSize: '13px',
                  marginTop: '4px',
                  color: '#999999'
                }}>
                  {editFormData.bio?.length || 0}/500 characters
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#000000'
                }}>
                  Location
                </label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => handleEditFormChange('location', e.target.value)}
                  placeholder="Where are you from?"
                  style={{
                    width: '100%',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    color: '#000000',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    height: '52px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6366F1'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#000000'
                }}>
                  Website
                </label>
                <input
                  type="url"
                  value={editFormData.website}
                  onChange={(e) => handleEditFormChange('website', e.target.value)}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    color: '#000000',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    height: '52px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6366F1'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              {saveError && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '14px'
                }}>
                  <p style={{
                    color: '#EF4444',
                    fontSize: '14px'
                  }}>{saveError}</p>
                </div>
              )}

              {saveSuccess && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '14px'
                }}>
                  <p style={{
                    color: '#10B981',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle style={{ width: '20px', height: '20px' }} />
                    Profile updated successfully!
                  </p>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px'
              }}>
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  style={{
                    flex: 1,
                    minHeight: '56px',
                    padding: '16px',
                    background: saveLoading ? '#D1D5DB' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: 'white',
                    borderRadius: '14px',
                    fontWeight: '600',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: saveLoading ? 'not-allowed' : 'pointer',
                    opacity: saveLoading ? 0.5 : 1,
                    boxShadow: saveLoading ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    if (!saveLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.35)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saveLoading) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)'
                    }
                  }}
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCloseEditModal}
                  disabled={saveLoading}
                  style={{
                    minHeight: '56px',
                    padding: '16px',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '14px',
                    fontWeight: '600',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    color: '#666666',
                    cursor: saveLoading ? 'not-allowed' : 'pointer',
                    opacity: saveLoading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!saveLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saveLoading) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
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
          <div style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '32px',
            maxWidth: '672px',
            width: '100%',
            margin: '0 16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#000000'
              }}>Send Message to @{user.username}</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                style={{
                  minHeight: '48px',
                  padding: '8px',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  color: '#666666',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F5F5F5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
                aria-label="Close modal"
              >
                <X style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#000000'
                }}>
                  Message
                </label>
                <textarea
                  placeholder="Type your message..."
                  rows={6}
                  style={{
                    width: '100%',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    color: '#000000',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6366F1'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button style={{
                  flex: 1,
                  minHeight: '56px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: 'white',
                  borderRadius: '14px',
                  fontWeight: '600',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.35)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)'
                }}
                >
                  Send Message
                </button>
                <button
                  onClick={() => setShowMessageModal(false)}
                  style={{
                    minHeight: '56px',
                    padding: '16px',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '14px',
                    fontWeight: '600',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    color: '#666666',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
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
