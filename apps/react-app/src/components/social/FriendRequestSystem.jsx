import React, { useState, useEffect } from 'react'
import { 
  Users, UserPlus, UserCheck, UserX, Clock, Search, 
  Bell, Heart, MessageSquare, MoreHorizontal, Check, X,
  Filter, SortDesc, RefreshCw
} from 'lucide-react'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'
const FriendRequestSystem = ({ onClose, initialTab = 'received' }) => {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filterBy, setFilterBy] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  })

  useEffect(() => {
    loadRequests()
  }, [activeTab, pagination.page, sortBy, filterBy])

  const loadRequests = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPagination(prev => ({ ...prev, page: 1 }))
      }

      const response = await socialService.getFriendRequests(
        activeTab,
        reset ? 1 : pagination.page,
        pagination.limit
      )

      const newRequests = response.requests || []
      
      setRequests(reset ? newRequests : [...requests, ...newRequests])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        hasMore: response.hasMore || false
      })
      
    } catch (error) {
      console.error('Error loading friend requests:', error)
      showToast('Failed to load requests', 'error')
      
      // Mock data for demo
      const mockRequests = [
        {
          id: '1',
          user: {
            id: 'user1',
            username: 'techguru',
            displayName: 'Tech Guru',
            avatar: null,
            isVerified: true
          },
          message: 'Hey! I love your posts about web development. Would love to connect!',
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          mutualFriends: 5,
          mutualConnections: ['user2', 'user3']
        },
        {
          id: '2',
          user: {
            id: 'user2',
            username: 'cryptoking',
            displayName: 'Crypto King',
            avatar: '👑',
            isVerified: false
          },
          message: '',
          sentAt: new Date(Date.now() - 7200000).toISOString(),
          mutualFriends: 12,
          mutualConnections: ['user1', 'user4']
        },
        {
          id: '3',
          user: {
            id: 'user3',
            username: 'nftcollector',
            displayName: 'NFT Collector',
            avatar: '🎨',
            isVerified: true
          },
          message: 'Found you through the CRYB community! Your NFT insights are amazing.',
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          mutualFriends: 3,
          mutualConnections: ['user1']
        }
      ]
      
      setRequests(mockRequests)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      await socialService.acceptFriendRequest(requestId)
      
      setRequests(prev => prev.filter(req => req.id !== requestId))
      showToast('Friend request accepted!', 'success')
      
    } catch (error) {
      console.error('Error accepting request:', error)
      showToast('Failed to accept request', 'error')
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      await socialService.rejectFriendRequest(requestId)
      
      setRequests(prev => prev.filter(req => req.id !== requestId))
      showToast('Friend request declined', 'success')
      
    } catch (error) {
      console.error('Error rejecting request:', error)
      showToast('Failed to reject request', 'error')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRequests(true)
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const diff = Date.now() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return date.toLocaleDateString()
  }

  const filteredRequests = requests.filter(request => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        request.user.username.toLowerCase().includes(query) ||
        request.user.displayName.toLowerCase().includes(query) ||
        request.message.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getTabCount = (tab) => {
    // This would come from the API in real implementation
    return tab === 'received' ? requests.length : 0
  }

  return (
    <div className="friend-request-modal">
      <div className="friend-request-container">
        {/* Header */}
        <div className="request-header">
          <div className="header-title">
            <Heart size={24} />
            <h2>Friend Requests</h2>
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
        <div className="request-tabs">
          <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'received' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setActiveTab('received')}
          >
            Received
            {getTabCount('received') > 0 && (
              <span className="tab-badge">{getTabCount('received')}</span>
            )}
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'sent' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setActiveTab('sent')}
          >
            Sent
            {getTabCount('sent') > 0 && (
              <span className="ml-auto px-2 py-0.5 bg-gray-700 rounded-full text-xs font-semibold">{getTabCount('sent')}</span>
            )}
          </button>
        </div>

        {/* Toolbar */}
        <div className="request-toolbar">
          <div className="search-section">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search requests..."
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
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mutual">Most Mutual Friends</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Filter by:</label>
              <select 
                value={filterBy} 
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Requests</option>
                <option value="with-message">With Message</option>
                <option value="mutual-friends">Mutual Friends</option>
                <option value="verified">Verified Users</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="request-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading requests...</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="requests-list">
              {filteredRequests.map(request => (
                <div key={request.id} className="request-card">
                  <div className="request-user">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                      {request.user.avatar ? (
                        typeof request.user.avatar === 'string' && request.user.avatar.startsWith('http') ? (
                          <img src={request.user.avatar} alt={request.user.username} />
                        ) : (
                          <span className="text-2xl">{request.user.avatar}</span>
                        )
                      ) : (
                        <div className="avatar-placeholder">
                          <Users size={20} />
                        </div>
                      )}
                      {request.user.isVerified && (
                        <div className="verified-badge">
                          <Check size={12} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <h3>{request.user.displayName}</h3>
                        <span className="username">@{request.user.username}</span>
                        <span className="request-time">
                          <Clock size={12} />
                          {formatTimeAgo(request.sentAt)}
                        </span>
                      </div>
                      
                      {request.message && (
                        <p className="request-message">"{request.message}"</p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {request.mutualFriends > 0 && (
                          <span className="mutual-friends">
                            <Users size={12} />
                            {request.mutualFriends} mutual friends
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="request-actions">
                    {activeTab === 'received' ? (
                      <>
                        <button 
                          className="btn-accept"
                          onClick={() => handleAcceptRequest(request.id)}
                          title="Accept friend request"
                        >
                          <Check size={14} />
                          Accept
                        </button>
                        <button 
                          className="btn-reject"
                          onClick={() => handleRejectRequest(request.id)}
                          title="Decline friend request"
                        >
                          <X size={14} />
                          Decline
                        </button>
                        <button 
                          className="btn-secondary"
                          title="View profile"
                        >
                          <Users size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="sent-status">
                        <Clock size={14} />
                        Pending
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Load More */}
              {pagination.hasMore && (
                <button 
                  className="load-more-btn"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={loading}
                >
                  Load More Requests
                </button>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <Heart size={48} />
              <h3>
                {activeTab === 'received' 
                  ? 'No friend requests' 
                  : 'No sent requests'}
              </h3>
              <p>
                {activeTab === 'received' 
                  ? 'When people send you friend requests, they\'ll appear here'
                  : 'Friend requests you\'ve sent will appear here'}
              </p>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="request-stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{pagination.total}</span>
          </div>
          {searchQuery && (
            <div className="stat-item">
              <span className="stat-label">Filtered:</span>
              <span className="stat-value">{filteredRequests.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



export default FriendRequestSystem