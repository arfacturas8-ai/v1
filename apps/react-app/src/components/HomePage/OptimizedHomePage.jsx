/**
 * Optimized and Accessible HomePage
 * - WCAG 2.1 AA Compliant
 * - Performance optimized with React.memo and useMemo
 * - Offline-first with IndexedDB caching
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { getErrorMessage } from "../../utils/errorUtils";
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Users,
  MessageCircle,
  Plus,
  Activity,
  Flame,
  Eye,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { formatNumber } from '../../lib/utils'
import communityService from '../../services/communityService'
import postsService from '../../services/postsService'
import apiService from '../../services/api'
import offlineStorage from '../../services/offlineStorage'
import { SkipToContent, announce, useLoadingAnnouncement } from '../../utils/accessibility'
import AccessibleButton from '../ui/AccessibleButton'

// Memoized StatCard component for performance
const StatCard = React.memo(({ icon: Icon, label, value, trend, color }) => (
  <div}
    style={{
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
    role="article"
    aria-label={`${label}: ${value}`}
  >
    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
      <div>
        <p style={{
  color: '#A0A0A0'
}}>{label}</p>
        <p style={{
  fontWeight: 'bold'
}} aria-live="polite">
          {value}
        </p>
        {trend && (
          <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            <span className="sr-only">
              {trend > 0 ? 'increased' : 'decreased'} by {Math.abs(trend)} percent
            </span>
          </p>
        )}
      </div>
      <div style={{
  padding: '12px',
  borderRadius: '50%'
}} aria-hidden="true">
        <Icon style={{
  width: '24px',
  height: '24px',
  color: '#ffffff'
}} />
      </div>
    </div>
  </div>
))
StatCard.displayName = 'StatCard'

// Memoized CommunityCard component
const CommunityCard = React.memo(({ community, onClick }) => (
  <div}
    style={{
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
    onClick={onClick}
    role="article"
    aria-labelledby={`community-${community.id}-name`}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    }}
  >
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
      {community.icon && (
        <div className="text-3xl" aria-hidden="true">
          {community.icon}
        </div>
      )}
      <div style={{
  flex: '1'
}}>
        <h3 id={`community-${community.id}-name`} style={{
  fontWeight: '600'
}}>
          {community.name}
        </h3>
        <p style={{
  color: '#A0A0A0'
}}>
          {formatNumber(community.memberCount)} members
          <span className="sr-only">,</span>
          <span style={{
  marginLeft: '8px',
  marginRight: '8px'
}} aria-hidden="true">•</span>
          {formatNumber(community.onlineCount)} online
        </p>
      </div>
    </div>
    {community.description && (
      <p style={{
  color: '#A0A0A0'
}}>
        {community.description}
      </p>
    )}
  </div>
))
CommunityCard.displayName = 'CommunityCard'

// Memoized PostCard component
const PostCard = React.memo(({ post, onClick }) => (
  <article}
    style={{
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
    onClick={onClick}
    role="article"
    aria-labelledby={`post-${post.id}-title`}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    }}
  >
    <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
      <div style={{
  flex: '1'
}}>
        <h3 id={`post-${post.id}-title`} style={{
  fontWeight: '600'
}}>
          {post.title}
        </h3>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  color: '#A0A0A0'
}}>
          <span>
            <Users style={{
  width: '16px',
  height: '16px'
}} aria-hidden="true" />
            <span className="sr-only">Posted in</span>
            c/{post.communityName}
          </span>
          <span>
            <MessageCircle style={{
  width: '16px',
  height: '16px'
}} aria-hidden="true" />
            {formatNumber(post.commentCount)}
            <span className="sr-only">comments</span>
          </span>
          <span>
            <TrendingUp style={{
  width: '16px',
  height: '16px'
}} aria-hidden="true" />
            {formatNumber(post.score)}
            <span className="sr-only">points</span>
          </span>
        </div>
      </div>
      {post.isTrending && (
        <div
          className="text-orange-500"
          aria-label="Trending post"
          title="Trending"
        >
          <Flame style={{
  width: '20px',
  height: '20px'
}} />
        </div>
      )}
    </div>
  </article>
))
PostCard.displayName = 'PostCard'

function OptimizedHomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [liveStats, setLiveStats] = useState(null)
  const [featuredCommunities, setFeaturedCommunities] = useState([])
  const [trendingPosts, setTrendingPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Announce loading state to screen readers
  useLoadingAnnouncement(loading, 'Loading home page content')

  // Memoized stats display
  const statsDisplay = useMemo(() => {
    if (!liveStats) return []

    return [
      {
        icon: Users,
        label: 'Active Users',
        value: formatNumber(liveStats.activeUsers || 0),
        trend: liveStats.userTrend,
        color: 'bg-[#58a6ff]'
      },
      {
        icon: MessageCircle,
        label: 'Total Posts',
        value: formatNumber(liveStats.totalPosts || 0),
        trend: liveStats.postTrend,
        color: 'bg-green-500'
      },
      {
        icon: Activity,
        label: 'Communities',
        value: formatNumber(liveStats.totalCommunities || 0),
        trend: liveStats.communityTrend,
        color: 'bg-[#a371f7]'
      },
      {
        icon: Sparkles,
        label: 'New Today',
        value: formatNumber(liveStats.newToday || 0),
        color: 'bg-orange-500'
      }
    ]
  }, [liveStats])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      announce('Connection restored', 'polite')
    }

    const handleOffline = () => {
      setIsOffline(true)
      announce('You are offline. Showing cached content.', 'assertive')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Fetch live stats
  useEffect(() => {
    const fetchLiveStats = async () => {
      if (isOffline) return

      try {
        const response = await apiService.get('/stats/live')
        if (response.success && response.data) {
          setLiveStats(response.data)
        }
      } catch (err) {
        console.error('Failed to fetch live stats:', err)
      }
    }

    fetchLiveStats()
    const interval = setInterval(fetchLiveStats, 30000)
    return () => clearInterval(interval)
  }, [isOffline])

  // Fetch data with offline support
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (isOffline) {
        // Load from offline storage
        const [cachedCommunities, cachedPosts] = await Promise.all([
          offlineStorage.getCommunities(),
          offlineStorage.getPosts({ limit: 3 })
        ])

        setFeaturedCommunities(cachedCommunities.slice(0, 6))
        setTrendingPosts(cachedPosts)
        announce('Showing cached content. Connect to the internet for latest updates.', 'polite')
      } else {
        // Fetch from API
        const [communitiesResult, postsResult] = await Promise.all([
          communityService.getCommunities({ sort: 'featured', limit: 6 }),
          postsService.getPosts({ sort: 'trending', limit: 3 })
        ])

        if (communitiesResult.success) {
          const communities = communitiesResult.communities || []
          setFeaturedCommunities(communities)
          // Cache for offline use
          offlineStorage.saveCommunities(communities)
        }

        if (postsResult.success) {
          const posts = postsResult.posts || []
          setTrendingPosts(posts)
          // Cache for offline use
          offlineStorage.savePosts(posts)
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load content. Please try again.')
      announce('Failed to load content', 'assertive')
    } finally {
      setLoading(false)
    }
  }, [isOffline])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Memoized navigation handlers
  const handleCommunityClick = useCallback((community) => {
    navigate(`/c/${community.name}`)
  }, [navigate])

  const handlePostClick = useCallback((post) => {
    navigate(`/posts/${post.id}`)
  }, [navigate])

  const handleCreatePost = useCallback(() => {
    navigate('/submit')
  }, [navigate])

  return (
    <div style={{
  background: 'rgba(22, 27, 34, 0.6)'
}}>
      <SkipToContent targetId="main-content" />

      {/* Offline indicator */}
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  textAlign: 'center'
}}
        >
          <span aria-label="Offline mode active">
            ⚠️ You're offline. Showing cached content.
          </span>
        </div>
      )}

      {/* Header */}
      <header style={{
  position: 'sticky'
}}>
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h1 style={{
  fontWeight: 'bold'
}}>CRYB Platform</h1>
            {user && (
              <AccessibleButton
                onClick={handleCreatePost}
                ariaLabel="Create new post"
                icon={<Plus style={{
  width: '20px',
  height: '20px'
}} />}
                style={{
  color: '#ffffff',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
              >
                Create Post
              </AccessibleButton>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}
          >
            <p className="text-red-800">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
          </div>
        )}

        {/* Live Stats */}
        {liveStats && (
          <section aria-labelledby="stats-heading" className="mb-8">
            <h2 id="stats-heading" className="sr-only">
              Platform Statistics
            </h2>
            <div style={{
  display: 'grid',
  gap: '16px'
}}>
              {statsDisplay.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Communities */}
        <section aria-labelledby="communities-heading" className="mb-8">
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h2 id="communities-heading" style={{
  fontWeight: 'bold'
}}>
              Featured Communities
            </h2>
            <Link
              to="/communities"
              style={{
  fontWeight: '500'
}}
              aria-label="View all communities"
            >
              View All
            </Link>
          </div>
          <div style={{
  display: 'grid',
  gap: '16px'
}}>
            {featuredCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onClick={() => handleCommunityClick(community)}
              />
            ))}
          </div>
        </section>

        {/* Trending Posts */}
        <section aria-labelledby="posts-heading">
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h2 id="posts-heading" style={{
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <Flame style={{
  width: '20px',
  height: '20px'
}} aria-hidden="true" />
              Trending Posts
            </h2>
            <Link
              to="/posts?sort=trending"
              style={{
  fontWeight: '500'
}}
              aria-label="View all trending posts"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {trendingPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => handlePostClick(post)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}



export default React.memo(OptimizedHomePage)

