import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { getErrorMessage } from "../utils/errorUtils"
import { Link } from 'react-router-dom'
import {
  Heart,
  MessageSquare,
  Share2,
  UserPlus,
  Award,
  Users,
  Home,
  Edit,
  TrendingUp,
  AlertCircle,
  Inbox
} from 'lucide-react'
import apiService from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useResponsive } from '../hooks/useResponsive'

function ActivityFeedPage() {
  const { user: currentUser } = useAuth()
  const { isDesktop, isTablet, isMobile } = useResponsive()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, friends, following

  // Responsive values
  const pagePadding = useMemo(() =>
    isDesktop ? '80px' : isTablet ? '24px' : '16px',
    [isDesktop, isTablet]
  )
  const headerPaddingTop = useMemo(() =>
    isDesktop || isTablet ? '72px' : '56px',
    [isDesktop, isTablet]
  )

  useEffect(() => {
    loadActivityFeed()
  }, [filter])

  const loadActivityFeed = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('filter', filter)
      }

      const response = await apiService.get(`/activity/feed?${params}`)

      if (response.success && response.data) {
        setActivities(response.data.activities || response.data || [])
      } else {
        setActivities([])
      }
    } catch (error) {
      console.error('Error loading activity feed:', error)
      setError('Failed to load activity feed. Please try again.')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  const ActivityIcon = useMemo(() => ({ type }) => {
    const iconConfig = {
      post_created: { icon: Edit, color: '#58a6ff', bg: 'rgba(88, 166, 255, 0.15)' },
      comment_created: { icon: MessageSquare, color: '#00d2d3', bg: 'rgba(0, 210, 211, 0.15)' },
      post_liked: { icon: Heart, color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.15)' },
      user_followed: { icon: UserPlus, color: '#51cf66', bg: 'rgba(81, 207, 102, 0.15)' },
      community_joined: { icon: Home, color: '#ffa94d', bg: 'rgba(255, 169, 77, 0.15)' },
      achievement_earned: { icon: Award, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
      friend_added: { icon: Users, color: '#58a6ff', bg: 'rgba(88, 166, 255, 0.15)' }
    }

    const config = iconConfig[type] || { icon: TrendingUp, color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)' }
    const Icon = config.icon

    return (
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: config.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
        aria-hidden="true"
      >
        <Icon style={{ width: '24px', height: '24px', color: config.color, flexShrink: 0 }} />
      </div>
    )
  }, [])

  const formatTimeAgo = useCallback((timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)

    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      return time.toLocaleDateString()
    }
  }, [])

  const renderActivityContent = useCallback((activity) => {
    const userLink = (username, displayName) => (
      <Link
        to={`/user/${username}`}
        style={{
          color: '#58a6ff',
          fontWeight: '600',
          textDecoration: 'none',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.color = '#79b8ff'}
        onMouseLeave={(e) => e.target.style.color = '#58a6ff'}
      >
        {displayName}
      </Link>
    )

    const secondaryText = (text) => (
      <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
    )

    switch (activity.type) {
      case 'post_created':
        return (
          <div>
            <p style={{ color: 'var(--text-primary)', fontSize: '16px', marginBottom: '8px' }}>
              {userLink(activity.username, activity.displayName)}{' '}
              {secondaryText('created a new post')}
            </p>
            {activity.content && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <h4 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  {activity.content.title}
                </h4>
                {activity.content.excerpt && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                    {activity.content.excerpt}
                  </p>
                )}
              </div>
            )}
          </div>
        )

      case 'comment_created':
        return (
          <div>
            <p style={{ color: 'var(--text-primary)', fontSize: '16px', marginBottom: '8px' }}>
              {userLink(activity.username, activity.displayName)}{' '}
              {secondaryText('commented on a post')}
            </p>
            {activity.content && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5' }}>
                  {activity.content.comment}
                </p>
              </div>
            )}
          </div>
        )

      case 'post_liked':
        return (
          <p style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
            {userLink(activity.username, activity.displayName)}{' '}
            {secondaryText('liked a post: "')}
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              {activity.content?.title || 'Untitled'}
            </span>
            {secondaryText('"')}
          </p>
        )

      case 'user_followed':
        return (
          <p style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
            {userLink(activity.username, activity.displayName)}{' '}
            {secondaryText('started following ')}{' '}
            {userLink(activity.content?.targetUsername, activity.content?.targetName)}
          </p>
        )

      case 'community_joined':
        return (
          <p style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
            {userLink(activity.username, activity.displayName)}{' '}
            {secondaryText('joined the ')}
            <Link
              to={`/c/${activity.content?.communityName}`}
              style={{
                color: '#58a6ff',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#79b8ff'}
              onMouseLeave={(e) => e.target.style.color = '#58a6ff'}
            >
              {activity.content?.communityName}
            </Link>
            {secondaryText(' community')}
          </p>
        )

      case 'achievement_earned':
        return (
          <p style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
            {userLink(activity.username, activity.displayName)}{' '}
            {secondaryText('earned the "')}
            <span style={{ color: '#51cf66', fontWeight: '600' }}>
              {activity.content?.badgeName}
            </span>
            {secondaryText('" achievement')}
          </p>
        )

      case 'friend_added':
        return (
          <p style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
            {userLink(activity.username, activity.displayName)}{' '}
            {secondaryText('and ')}{' '}
            {userLink(activity.content?.friendUsername, activity.content?.friendName)}{' '}
            {secondaryText('are now friends')}
          </p>
        )

      default:
        return (
          <p style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
            {userLink(activity.username, activity.displayName)}{' '}
            {secondaryText(activity.content?.message || 'had some activity')}
          </p>
        )
    }
  }, [])

  if (error) {
    return (
      <div
        role="main"
        aria-label="Activity feed page"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
          padding: `${headerPaddingTop} ${pagePadding} 48px`
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div
            role="alert"
            aria-live="polite"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px',
              padding: '48px 24px'
            }}
          >
            <div style={{ marginBottom: '24px' }} aria-hidden="true">
              <AlertCircle
                style={{
                  width: '64px',
                  height: '64px',
                  color: 'var(--semantic-error)',
                  margin: '0 auto',
                  flexShrink: 0
                }}
              />
            </div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
              Error Loading Activity Feed
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '32px' }}>
              {typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}
            </p>
            <button
              onClick={loadActivityFeed}
              style={{
                height: '48px',
                paddingLeft: '24px',
                paddingRight: '24px',
                backgroundColor: '#58a6ff',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#79b8ff'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#58a6ff'
                e.target.style.transform = 'translateY(0)'
              }}
              aria-label="Retry loading activity feed"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        padding: `${headerPaddingTop} ${pagePadding} 48px`
      }}
      role="main"
      aria-label="Activity feed page"
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: isMobile ? '28px' : '36px', fontWeight: '700', marginBottom: '8px' }}>
            Activity Feed
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.5' }}>
            Stay updated with what your friends and followed users are up to
          </p>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '32px'
          }}
        >
          <nav
            style={{ display: 'flex', gap: isMobile ? '16px' : '32px' }}
            role="navigation"
            aria-label="Activity filter"
          >
            {[
              { id: 'all', label: 'All Activity' },
              { id: 'friends', label: 'Friends' },
              { id: 'following', label: 'Following' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                  borderBottom: filter === tab.id ? '2px solid #58a6ff' : '2px solid transparent',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: filter === tab.id ? '#58a6ff' : 'var(--text-secondary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: filter === tab.id ? '2px solid #58a6ff' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (filter !== tab.id) {
                    e.target.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== tab.id) {
                    e.target.style.color = 'var(--text-secondary)'
                  }
                }}
                aria-pressed={filter === tab.id}
                aria-label={`Show ${tab.label.toLowerCase()} activity`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Activity Feed */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '16px',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '12px',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        height: '20px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        width: '75%',
                        marginBottom: '12px'
                      }}
                    />
                    <div
                      style={{
                        height: '16px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        width: '50%'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '16px',
                  padding: '24px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* User Avatar */}
                  <div style={{ flexShrink: 0 }}>
                    <Link to={`/user/${activity.username}`} style={{ display: 'block' }}>
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '24px',
                          fontWeight: '700',
                          boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {activity.avatar}
                      </div>
                    </Link>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Activity Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <ActivityIcon type={activity.type} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>

                    {/* Activity Content */}
                    {renderActivityContent(activity)}

                    {/* Engagement Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          height: '36px',
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ff6b6b'
                          e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)'
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        aria-label="Like activity"
                      >
                        <Heart style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                        <span>Like</span>
                      </button>

                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          height: '36px',
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#58a6ff'
                          e.currentTarget.style.backgroundColor = 'rgba(88, 166, 255, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)'
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        aria-label="Comment on activity"
                      >
                        <MessageSquare style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                        <span>Comment</span>
                      </button>

                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          height: '36px',
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#51cf66'
                          e.currentTarget.style.backgroundColor = 'rgba(81, 207, 102, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)'
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        aria-label="Share activity"
                      >
                        <Share2 style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: isMobile ? '48px 0' : '80px 0' }}>
            <div style={{ marginBottom: '32px' }} aria-hidden="true">
              <Inbox
                style={{
                  width: '80px',
                  height: '80px',
                  color: 'var(--text-tertiary)',
                  margin: '0 auto',
                  flexShrink: 0
                }}
              />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
              No activity yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.5', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
              {filter === 'friends'
                ? "Your friends haven't been active recently"
                : filter === 'following'
                ? "Users you follow haven't been active recently"
                : "Start following users and making friends to see their activity"}
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    height: '48px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)'
                    e.target.style.borderColor = 'var(--border-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-secondary)'
                    e.target.style.borderColor = 'var(--border-primary)'
                  }}
                  aria-label="View all activity"
                >
                  View All Activity
                </button>
              )}
              {filter === 'all' && (
                <Link
                  to="/users"
                  style={{
                    height: '48px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 8px 20px rgba(88, 166, 255, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 4px 12px rgba(88, 166, 255, 0.3)'
                  }}
                  aria-label="Discover users"
                >
                  Discover Users
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Load More */}
        {activities.length > 0 && activities.length % 10 === 0 && (
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button
              style={{
                height: '48px',
                paddingLeft: '32px',
                paddingRight: '32px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--bg-tertiary)'
                e.target.style.borderColor = 'var(--border-hover)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--bg-secondary)'
                e.target.style.borderColor = 'var(--border-primary)'
              }}
              aria-label="Load more activities"
            >
              Load More Activity
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityFeedPage
