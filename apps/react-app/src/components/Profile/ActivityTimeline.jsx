import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  MessageSquare, Heart, Share2, Award, UserPlus, 
  Calendar, Clock, ChevronDown, Filter, Eye,
  FileText, Users, Hash, Star, Gift, Zap,
  TrendingUp, Target, Bookmark, Flag, Edit3
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import profileService from '../../services/profileService'
import { useToast } from '../ui/useToast'


export default function ActivityTimeline({ 
  userId = null, 
  variant = 'full', // 'full', 'compact', 'summary'
  limit = 20,
  showFilters = true,
  className = ''
}) {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const timelineRef = useRef(null)
  
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'posts', 'comments', 'reactions', 'follows', 'achievements'
    timeframe: 'all', // 'all', 'today', 'week', 'month', 'year'
    visibility: 'public' // 'public', 'friends', 'private'
  })
  
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [groupedByDate, setGroupedByDate] = useState({})

  useEffect(() => {
    loadActivities(true)
  }, [userId, filters])

  useEffect(() => {
    groupActivitiesByDate()
  }, [activities])

  const loadActivities = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(1)
      } else {
        setLoadingMore(true)
      }

      const currentPage = reset ? 1 : page
      const response = await profileService.getUserActivity(
        userId, 
        currentPage, 
        limit, 
        filters
      )
      
      const newActivities = response.activities || []
      
      if (reset) {
        setActivities(newActivities)
      } else {
        setActivities(prev => [...prev, ...newActivities])
      }
      
      setHasMore(newActivities.length === limit)
      if (!reset) {
        setPage(prev => prev + 1)
      }
      
    } catch (error) {
      console.error('Error loading activities:', error)
      
      // Fallback to mock data for demo
      const mockActivities = generateMockActivities()
      if (reset) {
        setActivities(mockActivities)
      }
      
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const generateMockActivities = () => {
    const types = ['post', 'comment', 'reaction', 'follow', 'achievement', 'join_community']
    const mockData = []
    
    for (let i = 0; i < 15; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      
      mockData.push({
        id: `activity_${i}`,
        type,
        timestamp: date.toISOString(),
        user: {
          id: userId || 'current',
          username: 'demouser',
          displayName: 'Demo User',
          avatar: null
        },
        data: generateMockActivityData(type),
        visibility: 'public',
        reactions: {
          likes: Math.floor(Math.random() * 50),
          comments: Math.floor(Math.random() * 20)
        }
      })
    }
    
    return mockData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  const generateMockActivityData = (type) => {
    switch (type) {
      case 'post':
        return {
          title: 'Excited to share my latest project with the community!',
          content: 'Just finished building an amazing feature that I think you\'ll all love...',
          community: { name: 'Tech Enthusiasts', slug: 'tech' }
        }
      case 'comment':
        return {
          content: 'Great points! I totally agree with your perspective on this.',
          post: { title: 'The Future of Decentralized Platforms', id: 'post_123' }
        }
      case 'reaction':
        return {
          type: 'like',
          target: { type: 'post', title: 'Building Better Communities', id: 'post_456' }
        }
      case 'follow':
        return {
          target: { username: 'cryptoexpert', displayName: 'Crypto Expert', avatar: null }
        }
      case 'achievement':
        return {
          badge: 'Community Builder',
          description: 'Helped grow a community to 1000+ members',
          rarity: 'rare'
        }
      case 'join_community':
        return {
          community: { name: 'Web3 Developers', slug: 'web3-dev', memberCount: 2500 }
        }
      default:
        return {}
    }
  }

  const groupActivitiesByDate = () => {
    const grouped = {}
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp)
      const dateKey = date.toDateString()
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(activity)
    })
    
    setGroupedByDate(grouped)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadActivities(false)
    }
  }, [loadingMore, hasMore])

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = timelineRef.current?.querySelector('.timeline-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, loadingMore])

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return time.toLocaleDateString()
  }

  const getActivityIcon = (type) => {
    const icons = {
      post: FileText,
      comment: MessageSquare,
      reaction: Heart,
      follow: UserPlus,
      achievement: Award,
      join_community: Users,
      share: Share2,
      bookmark: Bookmark,
      edit: Edit3
    }
    return icons[type] || Zap
  }

  const getActivityColor = (type) => {
    const colors = {
      post: 'var(--accent-primary)',
      comment: 'var(--info-color)',
      reaction: 'var(--error-color)',
      follow: 'var(--success-color)',
      achievement: 'var(--warning-color)',
      join_community: 'var(--accent-secondary)',
      share: 'var(--accent-primary)',
      bookmark: 'var(--info-color)',
      edit: 'var(--text-secondary)'
    }
    return colors[type] || 'var(--text-secondary)'
  }

  if (loading) {
    return (
      <div className={`activity-timeline activity-timeline--loading ${className}`}>
        <div className="timeline-skeleton">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="activity-skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-header"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'summary') {
    return (
      <div className={`activity-timeline activity-timeline--summary ${className}`}>
        <div className="timeline-summary">
          <h3>Recent Activity</h3>
          <div className="summary-stats">
            <div className="summary-stat">
              <FileText size={16} />
              <span>{activities.filter(a => a.type === 'post').length} Posts</span>
            </div>
            <div className="summary-stat">
              <MessageSquare size={16} />
              <span>{activities.filter(a => a.type === 'comment').length} Comments</span>
            </div>
            <div className="summary-stat">
              <Heart size={16} />
              <span>{activities.filter(a => a.type === 'reaction').length} Reactions</span>
            </div>
          </div>
          <div className="recent-activities">
            {activities.slice(0, 3).map(activity => (
              <ActivityItem key={activity.id} activity={activity} variant="minimal" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`activity-timeline activity-timeline--${variant} ${className}`} ref={timelineRef}>
      {/* Filters */}
      {showFilters && (
        <div className="timeline-filters">
          <div className="filters-header">
            <h3>Activity Timeline</h3>
            <button 
              className={`filter-toggle ${showFilterPanel ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
          
          {showFilterPanel && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Activity Type</label>
                <select 
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Activities</option>
                  <option value="posts">Posts</option>
                  <option value="comments">Comments</option>
                  <option value="reactions">Reactions</option>
                  <option value="follows">Follows</option>
                  <option value="achievements">Achievements</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Time Period</label>
                <select 
                  value={filters.timeframe}
                  onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Visibility</label>
                <select 
                  value={filters.visibility}
                  onChange={(e) => handleFilterChange('visibility', e.target.value)}
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline Content */}
      <div className="timeline-content">
        {activities.length === 0 ? (
          <div className="timeline-empty">
            <Clock size={48} />
            <h3>No Activity Yet</h3>
            <p>Start engaging with the community to see your activity here!</p>
          </div>
        ) : (
          <div className="timeline-items">
            {Object.entries(groupedByDate).map(([dateKey, dayActivities]) => (
              <div key={dateKey} className="timeline-day">
                <div className="day-header">
                  <Calendar size={16} />
                  <span>{formatDateHeader(dateKey)}</span>
                </div>
                
                <div className="day-activities">
                  {dayActivities.map(activity => (
                    <ActivityItem 
                      key={activity.id} 
                      activity={activity} 
                      variant={variant}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load More */}
        {hasMore && (
          <div className="timeline-load-more">
            {loadingMore ? (
              <div className="loading-more">
                <div className="spinner"></div>
                <span>Loading more activities...</span>
              </div>
            ) : (
              <button className="btn-load-more" onClick={loadMore}>
                <ChevronDown size={16} />
                Load More Activities
              </button>
            )}
          </div>
        )}
        
        <div className="timeline-sentinel"></div>
      </div>
    </div>
  )
}

// Activity Item Component
function ActivityItem({ activity, variant = 'default' }) {
  const Icon = getActivityIcon(activity.type)
  const iconColor = getActivityColor(activity.type)
  
  if (variant === 'minimal') {
    return (
      <div className="activity-item activity-item--minimal">
        <div className="activity-icon" style={{ color: iconColor }}>
          <Icon size={14} />
        </div>
        <div className="activity-content">
          <span className="activity-text">
            {getActivityText(activity)}
          </span>
          <span className="activity-time">
            {formatTimeAgo(activity.timestamp)}
          </span>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`activity-item activity-item--${variant}`}>
      <div className="activity-icon" style={{ backgroundColor: iconColor }}>
        <Icon size={16} />
      </div>
      
      <div className="activity-content">
        <div className="activity-header">
          <div className="activity-text">
            {getActivityText(activity)}
          </div>
          <div className="activity-time">
            <Clock size={12} />
            <span>{formatTimeAgo(activity.timestamp)}</span>
          </div>
        </div>
        
        {activity.data && (
          <div className="activity-details">
            {renderActivityDetails(activity)}
          </div>
        )}
        
        {activity.reactions && variant === 'full' && (
          <div className="activity-reactions">
            <div className="reaction-item">
              <Heart size={14} />
              <span>{activity.reactions.likes}</span>
            </div>
            <div className="reaction-item">
              <MessageSquare size={14} />
              <span>{activity.reactions.comments}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper Functions
function formatDateHeader(dateKey) {
  const date = new Date(dateKey)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }
}

function getActivityText(activity) {
  switch (activity.type) {
    case 'post':
      return `Created a new post${activity.data.community ? ` in ${activity.data.community.name}` : ''}`
    case 'comment':
      return `Commented on "${activity.data.post?.title || 'a post'}"`
    case 'reaction':
      return `${activity.data.type === 'like' ? 'Liked' : 'Reacted to'} "${activity.data.target?.title || 'a post'}"`
    case 'follow':
      return `Started following ${activity.data.target?.displayName || activity.data.target?.username}`
    case 'achievement':
      return `Earned the "${activity.data.badge}" achievement`
    case 'join_community':
      return `Joined the ${activity.data.community?.name} community`
    default:
      return 'Activity'
  }
}

function renderActivityDetails(activity) {
  switch (activity.type) {
    case 'post':
      return (
        <div className="post-preview">
          <h4>{activity.data.title}</h4>
          {activity.data.content && (
            <p>{activity.data.content.substring(0, 150)}...</p>
          )}
        </div>
      )
    case 'comment':
      return (
        <div className="comment-preview">
          <p>"{activity.data.content}"</p>
        </div>
      )
    case 'achievement':
      return (
        <div className="achievement-preview">
          <div className="achievement-badge">
            <Star size={16} />
            <span>{activity.data.badge}</span>
          </div>
          <p>{activity.data.description}</p>
        </div>
      )
    case 'join_community':
      return (
        <div className="community-preview">
          <div className="community-info">
            <Hash size={16} />
            <span>{activity.data.community?.name}</span>
            <span className="member-count">
              {activity.data.community?.memberCount?.toLocaleString()} members
            </span>
          </div>
        </div>
      )
    default:
      return null
  }
}

function formatTimeAgo(timestamp) {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInSeconds = Math.floor((now - time) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return time.toLocaleDateString()
}

function getActivityIcon(type) {
  const icons = {
    post: FileText,
    comment: MessageSquare,
    reaction: Heart,
    follow: UserPlus,
    achievement: Award,
    join_community: Users,
    share: Share2,
    bookmark: Bookmark,
    edit: Edit3
  }
  return icons[type] || Zap
}

function getActivityColor(type) {
  const colors = {
    post: 'var(--accent-primary)',
    comment: 'var(--info-color)',
    reaction: 'var(--error-color)',
    follow: 'var(--success-color)',
    achievement: 'var(--warning-color)',
    join_community: 'var(--accent-secondary)',
    share: 'var(--accent-primary)',
    bookmark: 'var(--info-color)',
    edit: 'var(--text-secondary)'
  }
  return colors[type] || 'var(--text-secondary)'
}
