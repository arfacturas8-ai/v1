import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Activity, Heart, MessageSquare, UserPlus, Users, Share2,
  Trophy, Star, Zap, Calendar, Filter, RefreshCw, X,
  Bookmark, BookmarkCheck, MoreHorizontal, ExternalLink,
  Eye, Clock, TrendingUp, Bell, Settings
} from 'lucide-react'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'
import useSocialRealTime from '../../hooks/useSocialRealTime'
const SocialActivityFeed = ({ 
  onClose, 
  userId = null, 
  embedded = false,
  maxItems = 50 
}) => {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const { 
    isConnected, 
    getRecentActivities, 
    socialUpdates 
  } = useSocialRealTime({ enableActivityFeed: true })
  
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [timeRange, setTimeRange] = useState('week')
  const [showFilters, setShowFilters] = useState(false)
  const [savedActivities, setSavedActivities] = useState(new Set())
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasMore: true
  })

  const activityTypes = [
    { value: 'all', label: 'All Activity', icon: <Activity size={16} /> },
    { value: 'social', label: 'Social', icon: <Users size={16} /> },
    { value: 'posts', label: 'Posts', icon: <MessageSquare size={16} /> },
    { value: 'achievements', label: 'Achievements', icon: <Trophy size={16} /> },
    { value: 'connections', label: 'Connections', icon: <UserPlus size={16} /> }
  ]

  const timeRanges = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ]

  useEffect(() => {
    loadActivityFeed()
  }, [filterType, timeRange, userId])

  // Update with real-time activities
  useEffect(() => {
    if (isConnected) {
      const realtimeActivities = getRecentActivities(10)
      if (realtimeActivities.length > 0) {
        setActivities(prev => {
          const newActivities = realtimeActivities.filter(
            activity => !prev.find(a => a.id === activity.id)
          )
          return [...newActivities, ...prev].slice(0, maxItems)
        })
      }
    }
  }, [socialUpdates.activities, isConnected, getRecentActivities, maxItems])

  const loadActivityFeed = async (reset = false) => {
    try {
      if (reset) {
        setRefreshing(true)
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        setLoading(true)
      }

      const filters = {
        type: filterType !== 'all' ? filterType : undefined,
        timeRange,
        userId
      }

      const response = await socialService.getSocialActivityFeed(
        reset ? 1 : pagination.page,
        pagination.limit,
        filters
      )

      const newActivities = response.activities || []
      
      if (reset) {
        setActivities(newActivities)
      } else {
        setActivities(prev => [...prev, ...newActivities])
      }

      setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        hasMore: response.hasMore || false
      })
      
    } catch (error) {
      console.error('Error loading activity feed:', error)
      showToast('Failed to load activity feed', 'error')
      
      // Mock data for demo
      const mockActivities = generateMockActivities()
      setActivities(mockActivities)
      
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const generateMockActivities = useCallback(() => {
    const activityTemplates = [
      {
        type: 'follow',
        action: 'started following',
        icon: <UserPlus size={16} />,
        color: '#00FF88'
      },
      {
        type: 'post',
        action: 'created a post',
        icon: <MessageSquare size={16} />,
        color: '#00BBFF'
      },
      {
        type: 'like',
        action: 'liked a post',
        icon: <Heart size={16} />,
        color: '#ff4444'
      },
      {
        type: 'achievement',
        action: 'earned an achievement',
        icon: <Trophy size={16} />,
        color: '#FFB800'
      },
      {
        type: 'join',
        action: 'joined a community',
        icon: <Users size={16} />,
        color: '#8B5CF6'
      },
      {
        type: 'share',
        action: 'shared a post',
        icon: <Share2 size={16} />,
        color: '#10B981'
      }
    ]

    const users = [
      { id: '1', username: 'techguru', displayName: 'Tech Guru', avatar: '👨‍💻' },
      { id: '2', username: 'cryptoking', displayName: 'Crypto King', avatar: '👑' },
      { id: '3', username: 'nftartist', displayName: 'NFT Artist', avatar: '🎨' },
      { id: '4', username: 'web3dev', displayName: 'Web3 Dev', avatar: '⚡' },
      { id: '5', username: 'daoqueen', displayName: 'DAO Queen', avatar: '👸' }
    ]

    return Array.from({ length: 20 }, (_, i) => {
      const template = activityTemplates[i % activityTemplates.length]
      const user = users[i % users.length]
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)

      return {
        id: `activity_${i}`,
        type: template.type,
        user,
        action: template.action,
        icon: template.icon,
        color: template.color,
        timestamp: timestamp.toISOString(),
        content: generateActivityContent(template.type, user),
        engagement: {
          likes: Math.floor(Math.random() * 50),
          comments: Math.floor(Math.random() * 20),
          shares: Math.floor(Math.random() * 15)
        },
        metadata: {
          postId: template.type === 'post' ? `post_${i}` : null,
          targetUser: template.type === 'follow' ? users[(i + 1) % users.length] : null,
          achievement: template.type === 'achievement' ? 'Early Adopter' : null,
          community: template.type === 'join' ? 'Web3 Developers' : null
        }
      }
    })
  }, [])

  const generateActivityContent = (type, user) => {
    switch (type) {
      case 'post':
        return `Just discovered an amazing new DeFi protocol that's changing the game! 🚀 #DeFi #Web3`
      case 'achievement':
        return `Unlocked the "Early Adopter" achievement for being one of the first 1000 users!`
      case 'follow':
        return `Started following some amazing creators in the Web3 space`
      case 'join':
        return `Joined the Web3 Developers community to connect with like-minded builders`
      case 'share':
        return `Shared an insightful post about the future of decentralized governance`
      case 'like':
        return `Loved a post about NFT utility and real-world applications`
      default:
        return `Engaged with the CRYB community`
    }
  }

  const handleSaveActivity = (activityId) => {
    setSavedActivities(prev => {
      const newSaved = new Set(prev)
      if (newSaved.has(activityId)) {
        newSaved.delete(activityId)
        showToast('Activity unsaved', 'info')
      } else {
        newSaved.add(activityId)
        showToast('Activity saved', 'success')
      }
      return newSaved
    })
  }

  const handleRefresh = () => {
    loadActivityFeed(true)
  }

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
      loadActivityFeed(false)
    }
  }

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (filterType !== 'all' && activity.type !== filterType) return false
      
      const activityDate = new Date(activity.timestamp)
      const now = new Date()
      
      switch (timeRange) {
        case 'day':
          return now - activityDate < 24 * 60 * 60 * 1000
        case 'week':
          return now - activityDate < 7 * 24 * 60 * 60 * 1000
        case 'month':
          return now - activityDate < 30 * 24 * 60 * 60 * 1000
        default:
          return true
      }
    })
  }, [activities, filterType, timeRange])

  const getActivityTypeIcon = (type) => {
    const typeMap = {
      follow: <UserPlus size={16} />,
      post: <MessageSquare size={16} />,
      like: <Heart size={16} />,
      achievement: <Trophy size={16} />,
      join: <Users size={16} />,
      share: <Share2 size={16} />
    }
    return typeMap[type] || <Activity size={16} />
  }

  const getActivityTypeColor = (type) => {
    const colorMap = {
      follow: '#00FF88',
      post: '#00BBFF',
      like: '#ff4444',
      achievement: '#FFB800',
      join: '#8B5CF6',
      share: '#10B981'
    }
    return colorMap[type] || '#666'
  }

  const ActivityItem = ({ activity }) => (
    <div className="activity-item">
      <div className="activity-avatar">
        {activity.user.avatar ? (
          typeof activity.user.avatar === 'string' && activity.user.avatar.startsWith('http') ? (
            <img src={activity.user.avatar} alt={activity.user.username} />
          ) : (
            <span className="text-2xl">{activity.user.avatar}</span>
          )
        ) : (
          <div className="avatar-placeholder">
            <Users size={16} />
          </div>
        )}
        
        <div 
          className="activity-type-badge"
          style={{ backgroundColor: getActivityTypeColor(activity.type) }}
        >
          {getActivityTypeIcon(activity.type)}
        </div>
      </div>

      <div className="activity-content">
        <div className="activity-header">
          <div className="activity-user">
            <span className="user-name">{activity.user.displayName}</span>
            <span className="username">@{activity.user.username}</span>
          </div>
          
          <div className="activity-meta">
            <span className="activity-time">
              <Clock size={12} />
              {formatTimeAgo(activity.timestamp)}
            </span>
            
            <button
              className="activity-actions-btn"
              onClick={() => {}}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        <div className="activity-description">
          <span className="activity-action">{activity.action}</span>
          {activity.metadata.targetUser && (
            <span className="target-user">
              {activity.metadata.targetUser.displayName}
            </span>
          )}
          {activity.metadata.achievement && (
            <span className="achievement-badge">
              <Trophy size={12} />
              {activity.metadata.achievement}
            </span>
          )}
          {activity.metadata.community && (
            <span className="community-badge">
              <Users size={12} />
              {activity.metadata.community}
            </span>
          )}
        </div>

        {activity.content && (
          <div className="activity-text">
            {activity.content}
          </div>
        )}

        <div className="activity-engagement">
          <button className="engagement-btn">
            <Heart size={14} />
            <span>{activity.engagement.likes}</span>
          </button>
          
          <button className="engagement-btn">
            <MessageSquare size={14} />
            <span>{activity.engagement.comments}</span>
          </button>
          
          <button className="engagement-btn">
            <Share2 size={14} />
            <span>{activity.engagement.shares}</span>
          </button>

          <button
            className={`save-btn ${savedActivities.has(activity.id) ? 'saved' : ''}`}
            onClick={() => handleSaveActivity(activity.id)}
          >
            {savedActivities.has(activity.id) ? 
              <BookmarkCheck size={14} /> : 
              <Bookmark size={14} />
            }
          </button>
        </div>
      </div>
    </div>
  )

  const content = (
    <div className="activity-feed-content">
      {/* Header */}
      {!embedded && (
        <div className="feed-header">
          <div className="header-title">
            <Activity size={24} />
            <div>
              <h2>Activity Feed</h2>
              <p>Stay updated with your social network</p>
            </div>
          </div>
          
          <div className="header-controls">
            <button
              className="control-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh feed"
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            </button>
            
            <button
              className={`control-btn ${showFilters ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Show filters"
            >
              <Filter size={16} />
            </button>
            
            {onClose && (
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="feed-filters">
          <div className="filter-section">
            <label>Activity Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-section">
            <label>Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          
          {isConnected && (
            <div className="realtime-indicator">
              <div className="realtime-dot" />
              <span>Live updates</span>
            </div>
          )}
        </div>
      )}

      {/* Activity List */}
      <div className="activity-list">
        {loading && activities.length === 0 ? (
          <div className="feed-loading">
            <div className="spinner" />
            <p>Loading activity feed...</p>
          </div>
        ) : filteredActivities.length > 0 ? (
          <>
            {filteredActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
            
            {pagination.hasMore && (
              <button 
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Activity'}
              </button>
            )}
          </>
        ) : (
          <div className="empty-feed">
            <Activity size={48} />
            <h3>No activity found</h3>
            <p>
              {filterType !== 'all' || timeRange !== 'all'
                ? 'Try adjusting your filters to see more activity'
                : 'Follow more users to see their activity here'}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="social-activity-modal">
      <div className="activity-container">
        {content}
      </div>
    </div>
  )
}



export default SocialActivityFeed