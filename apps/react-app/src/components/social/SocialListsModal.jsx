import React, { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, UserMinus, UserCheck, Search, Filter,
  SortDesc, RefreshCw, X, Heart, MessageSquare, MoreHorizontal,
  Star, MapPin, Calendar, Eye, EyeOff, Shield
} from 'lucide-react'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'
import FollowButton from './FollowButton'
import { useResponsive } from '../../hooks/useResponsive'

const SocialListsModal = ({
  userId,
  initialTab = 'followers',
  onClose,
  onUserSelect = null
}) => {
  const { isMobile, isTablet } = useResponsive()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState(initialTab)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [filterBy, setFilterBy] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  })

  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    friends: 0,
    mutualConnections: 0
  })

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null)

  useEffect(() => {
    loadUsers(true)
    loadStats()
  }, [activeTab, userId])

  useEffect(() => {
    // Debounced search
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      if (searchQuery !== '') {
        loadUsers(true)
      }
    }, 300)
    
    setSearchTimeout(timeout)
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchQuery])

  useEffect(() => {
    loadUsers(true)
  }, [sortBy, filterBy])

  const loadUsers = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPagination(prev => ({ ...prev, page: 1 }))
      }

      const page = reset ? 1 : pagination.page
      let response

      switch (activeTab) {
        case 'followers':
          response = await socialService.getFollowers(userId, page, pagination.limit, searchQuery)
          break
        case 'following':
          response = await socialService.getFollowing(userId, page, pagination.limit, searchQuery)
          break
        case 'friends':
          response = await socialService.getFriends(userId, page, pagination.limit, searchQuery)
          break
        case 'mutual':
          response = await socialService.getMutualConnections(userId, pagination.limit)
          break
        default:
          response = { users: [], total: 0, hasMore: false }
      }

      const newUsers = response.users || response.data || []
      
      setUsers(reset ? newUsers : [...users, ...newUsers])
      setPagination({
        page: response.page || page,
        limit: response.limit || pagination.limit,
        total: response.total || 0,
        hasMore: response.hasMore || false
      })
      
    } catch (error) {
      console.error('Error loading users:', error)
      showToast('Failed to load users', 'error')
      
      // Mock data for demo
      const mockUsers = generateMockUsers(activeTab)
      setUsers(mockUsers)
      setPagination({
        page: 1,
        limit: 20,
        total: mockUsers.length,
        hasMore: false
      })
      
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await socialService.getNetworkStats(userId)
      setStats({
        followers: response.followers || 0,
        following: response.following || 0,
        friends: response.friends || 0,
        mutualConnections: response.mutualConnections || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Mock stats
      setStats({
        followers: 1234,
        following: 567,
        friends: 89,
        mutualConnections: 23
      })
    }
  }

  const generateMockUsers = (tab) => {
    const baseUsers = [
      {
        id: 'user1',
        username: 'techguru',
        displayName: 'Tech Guru',
        avatar: null,
        bio: 'Full-stack developer passionate about Web3 and blockchain technology.',
        isVerified: true,
        isOnline: true,
        joinedDate: '2023-01-15',
        location: 'San Francisco, CA',
        mutualConnections: 15,
        karma: 2456,
        relationship: {
          isFollowing: true,
          isFollower: false,
          isFriend: tab === 'friends',
          followedAt: '2023-06-15'
        }
      },
      {
        id: 'user2',
        username: 'cryptoking',
        displayName: 'Crypto King',
        avatar: '👑',
        bio: 'DeFi enthusiast and crypto trader. Building the future of finance.',
        isVerified: false,
        isOnline: false,
        joinedDate: '2023-03-20',
        location: 'New York, NY',
        mutualConnections: 8,
        karma: 1823,
        relationship: {
          isFollowing: false,
          isFollower: true,
          isFriend: false,
          followedAt: '2023-07-10'
        }
      },
      {
        id: 'user3',
        username: 'nftcollector',
        displayName: 'NFT Collector',
        avatar: '🎨',
        bio: 'Digital art collector and NFT enthusiast. Love discovering new artists.',
        isVerified: true,
        isOnline: true,
        joinedDate: '2023-02-08',
        location: 'London, UK',
        mutualConnections: 12,
        karma: 3190,
        relationship: {
          isFollowing: true,
          isFollower: true,
          isFriend: tab === 'friends',
          followedAt: '2023-05-22'
        }
      }
    ]

    return baseUsers.filter(user => {
      switch (tab) {
        case 'followers':
          return user.relationship.isFollower
        case 'following':
          return user.relationship.isFollowing
        case 'friends':
          return user.relationship.isFriend
        case 'mutual':
          return user.mutualConnections > 0
        default:
          return true
      }
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUsers(true)
    await loadStats()
  }

  const handleUserAction = useCallback((userId, action, newState) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, relationship: { ...user.relationship, ...newState } }
          : user
      )
    )
  }, [])

  const filteredAndSortedUsers = users
    .filter(user => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          user.username.toLowerCase().includes(query) ||
          user.displayName.toLowerCase().includes(query) ||
          (user.bio && user.bio.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Additional filters
      switch (filterBy) {
        case 'verified':
          return user.isVerified
        case 'online':
          return user.isOnline
        case 'mutual':
          return user.mutualConnections > 0
        case 'recent':
          return new Date(user.relationship.followedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.displayName.localeCompare(b.displayName)
        case 'karma':
          return (b.karma || 0) - (a.karma || 0)
        case 'mutual':
          return (b.mutualConnections || 0) - (a.mutualConnections || 0)
        case 'recent':
          return new Date(b.relationship.followedAt || 0) - new Date(a.relationship.followedAt || 0)
        default:
          return 0
      }
    })

  const getTabCount = (tab) => {
    switch (tab) {
      case 'followers':
        return stats.followers
      case 'following':
        return stats.following
      case 'friends':
        return stats.friends
      case 'mutual':
        return stats.mutualConnections
      default:
        return 0
    }
  }

  const formatJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="social-lists-modal">
      <div className="social-lists-container">
        {/* Header */}
        <div className="lists-header">
          <div className="header-title">
            <Users size={24} />
            <h2>Social Connections</h2>
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="lists-tabs">
          <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'followers' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setActiveTab('followers')}
          >
            Followers
            <span className="ml-auto px-2 py-0.5 bg-gray-700 rounded-full text-xs font-semibold">{getTabCount('followers')}</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'following' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setActiveTab('following')}
          >
            Following
            <span className="ml-auto px-2 py-0.5 bg-gray-700 rounded-full text-xs font-semibold">{getTabCount('following')}</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'friends' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends
            <span className="ml-auto px-2 py-0.5 bg-gray-700 rounded-full text-xs font-semibold">{getTabCount('friends')}</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'mutual' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setActiveTab('mutual')}
          >
            Mutual
            <span className="ml-auto px-2 py-0.5 bg-gray-700 rounded-full text-xs font-semibold">{getTabCount('mutual')}</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="lists-toolbar">
          <div className="search-section">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-section">
            <button 
              className={`filter-btn ${showFilters ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="karma">Highest Karma</option>
                <option value="mutual">Most Mutual</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Filter by:</label>
              <select 
                value={filterBy} 
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="verified">Verified Only</option>
                <option value="online">Online Now</option>
                <option value="mutual">Mutual Connections</option>
                <option value="recent">Recent Follows</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="lists-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading users...</p>
            </div>
          ) : filteredAndSortedUsers.length > 0 ? (
            <div className="users-list">
              {filteredAndSortedUsers.map(user => (
                <div key={user.id} className="user-item">
                  <div 
                    className="user-main"
                    onClick={() => onUserSelect && onUserSelect(user)}
                  >
                    <div style={{ width: "64px", height: "64px", flexShrink: 0 }}>
                      {user.avatar ? (
                        typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
                          <img src={user.avatar} alt={user.username} />
                        ) : (
                          <span className="text-2xl">{user.avatar}</span>
                        )
                      ) : (
                        <div className="avatar-placeholder">
                          <Users size={20} />
                        </div>
                      )}
                      
                      {/* Online indicator */}
                      {user.isOnline && (
                        <div className="online-indicator" title="Online now" />
                      )}
                      
                      {/* Verified badge */}
                      {user.isVerified && (
                        <div className="verified-badge" title="Verified user">
                          <Shield size={12} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <h3>{user.displayName}</h3>
                        <span className="username">@{user.username}</span>
                      </div>
                      
                      {user.bio && (
                        <p className="user-bio">{user.bio}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {user.karma && (
                          <span className="flex items-center gap-1">
                            <Star size={12} />
                            {user.karma} karma
                          </span>
                        )}
                        
                        {user.mutualConnections > 0 && (
                          <span className="meta-item mutual">
                            <Users size={12} />
                            {user.mutualConnections} mutual
                          </span>
                        )}
                        
                        {user.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {user.location}
                          </span>
                        )}
                        
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Joined {formatJoinDate(user.joinedDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FollowButton
                      userId={user.id}
                      initialState={user.relationship}
                      size="small"
                      variant="outline"
                      onStateChange={(newState) => handleUserAction(user.id, 'follow', newState)}
                    />
                    
                    <button 
                      className="action-btn secondary"
                      title="Send message"
                    >
                      <MessageSquare size={14} />
                    </button>
                    
                    <button 
                      className="action-btn secondary"
                      title="More options"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {pagination.hasMore && (
                <button 
                  className="load-more-btn"
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                    loadUsers(false)
                  }}
                  disabled={loading}
                >
                  Load More Users
                </button>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <Users size={48} />
              <h3>
                {searchQuery 
                  ? 'No users found' 
                  : `No ${activeTab} yet`}
              </h3>
              <p>
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : `${activeTab === 'followers' 
                      ? 'Your followers will appear here' 
                      : activeTab === 'following'
                      ? 'Users you follow will appear here'
                      : activeTab === 'friends'
                      ? 'Your friends will appear here'
                      : 'Mutual connections will appear here'}`}
              </p>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="lists-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{getTabCount(activeTab)}</span>
              <span className="stat-label">{activeTab}</span>
            </div>
            {searchQuery && (
              <div className="stat-item">
                <span className="stat-value">{filteredAndSortedUsers.length}</span>
                <span className="stat-label">filtered</span>
              </div>
            )}
            <div className="stat-item">
              <span className="stat-value">{stats.followers + stats.following}</span>
              <span className="stat-label">total connections</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



export default SocialListsModal