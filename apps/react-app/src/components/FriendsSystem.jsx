import React, { useState, useEffect } from 'react'
import { 
  Users, UserPlus, UserMinus, UserCheck, UserX, 
  Search, Filter, MoreVertical, MessageSquare,
  Bell, BellOff, Star, Clock, Check, X, Send,
  Activity, BarChart3, Eye, Settings, Sparkles
} from 'lucide-react'
import FollowButton from './Social/FollowButton'
import SocialListsModal from './Social/SocialListsModal'
import FriendRequestSystem from './Social/FriendRequestSystem'
import FriendSuggestions from './Social/FriendSuggestions'
import SocialActivityFeed from './Social/SocialActivityFeed'
import SocialAnalytics from './Social/SocialAnalytics'
import SocialPrivacySettings from './Social/SocialPrivacySettings'
import SocialGraphVisualization from './Social/SocialGraphVisualization'
import useSocialRealTime from '../hooks/useSocialRealTime'
import socialService from '../services/socialService'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './ui/useToast'
const FriendsSystem = ({ currentUser, onClose, initialView = 'dashboard' }) => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const {
    isConnected,
    socialUpdates,
    realTimeStats,
    followUser,
    unfollowUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
  } = useSocialRealTime({ enableNotifications: true })

  const [activeView, setActiveView] = useState(initialView)
  const [activeTab, setActiveTab] = useState('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [friends, setFriends] = useState([])
  const [following, setFollowing] = useState([])
  const [followers, setFollowers] = useState([])
  const [requests, setRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    loadFriendsData()
  }, [activeTab])

  // Update with real-time data
  useEffect(() => {
    if (isConnected) {
      setFriends(socialUpdates.friends || [])
      setFollowing(socialUpdates.following || [])
      setFollowers(socialUpdates.followers || [])
      setRequests(socialUpdates.requests || [])
    }
  }, [socialUpdates, isConnected])

  const loadFriendsData = async () => {
    setLoading(true)
    try {
      // Load data based on active tab to optimize performance
      const promises = []

      if (activeTab === 'friends' || activeTab === 'all') {
        promises.push(
          socialService.getFriends(null, 1, 50, searchQuery)
            .then(response => {
              if (response.success && response.data) {
                setFriends(response.data.friends || response.data.users || [])
              }
            })
            .catch(err => console.error('Failed to load friends:', err))
        )
      }

      if (activeTab === 'following' || activeTab === 'all') {
        promises.push(
          socialService.getFollowing(null, 1, 50, searchQuery)
            .then(response => {
              if (response.success && response.data) {
                setFollowing(response.data.following || response.data.users || [])
              }
            })
            .catch(err => console.error('Failed to load following:', err))
        )
      }

      if (activeTab === 'followers' || activeTab === 'all') {
        promises.push(
          socialService.getFollowers(null, 1, 50, searchQuery)
            .then(response => {
              if (response.success && response.data) {
                setFollowers(response.data.followers || response.data.users || [])
              }
            })
            .catch(err => console.error('Failed to load followers:', err))
        )
      }

      if (activeTab === 'requests' || activeTab === 'all') {
        promises.push(
          socialService.getFriendRequests('received', 1, 50)
            .then(response => {
              if (response.success && response.data) {
                setRequests(response.data.requests || [])
              }
            })
            .catch(err => console.error('Failed to load friend requests:', err))
        )
      }

      if (activeTab === 'suggestions' || activeTab === 'all') {
        promises.push(
          socialService.getFriendSuggestions(20, 'smart')
            .then(response => {
              if (response.success && response.data) {
                setSuggestions(response.data.suggestions || response.data.users || [])
              }
            })
            .catch(err => console.error('Failed to load suggestions:', err))
        )
      }

      // Wait for all API calls to complete
      await Promise.all(promises)
    } catch (error) {
      console.error('Failed to load friends data:', error)
      showToast?.({
        type: 'error',
        message: 'Failed to load social data. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId) => {
    try {
      const response = await socialService.followUser(userId)

      if (response.success) {
        // Optimistically update UI
        const user = suggestions.find(u => u.id === userId)
        if (user) {
          setFollowing(prev => [...prev, { ...user, isFollowing: true }])
          setSuggestions(prev => prev.filter(u => u.id !== userId))
        }

        showToast?.({
          type: 'success',
          message: 'Successfully followed user'
        })
      }
    } catch (error) {
      console.error('Failed to follow user:', error)
      showToast?.({
        type: 'error',
        message: 'Failed to follow user. Please try again.'
      })
    }
  }

  const handleUnfollow = async (userId) => {
    try {
      const response = await socialService.unfollowUser(userId)

      if (response.success) {
        setFollowing(prev => prev.filter(u => u.id !== userId))

        showToast?.({
          type: 'success',
          message: 'Successfully unfollowed user'
        })
      }
    } catch (error) {
      console.error('Failed to unfollow user:', error)
      showToast?.({
        type: 'error',
        message: 'Failed to unfollow user. Please try again.'
      })
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await socialService.acceptFriendRequest(requestId)

      if (response.success) {
        const request = requests.find(r => r.id === requestId)
        if (request) {
          setFriends(prev => [...prev, {
            ...request,
            status: 'online',
            isFollowing: true,
            notifications: true
          }])
        }
        setRequests(prev => prev.filter(r => r.id !== requestId))

        showToast?.({
          type: 'success',
          message: 'Friend request accepted'
        })
      }
    } catch (error) {
      console.error('Failed to accept request:', error)
      showToast?.({
        type: 'error',
        message: 'Failed to accept friend request. Please try again.'
      })
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await socialService.rejectFriendRequest(requestId)

      if (response.success) {
        setRequests(prev => prev.filter(r => r.id !== requestId))

        showToast?.({
          type: 'success',
          message: 'Friend request rejected'
        })
      }
    } catch (error) {
      console.error('Failed to reject request:', error)
      showToast?.({
        type: 'error',
        message: 'Failed to reject friend request. Please try again.'
      })
    }
  }

  const toggleNotifications = async (userId) => {
    try {
      // API call to toggle notifications
      setFriends(prev => prev.map(friend => 
        friend.id === userId 
          ? { ...friend, notifications: !friend.notifications }
          : friend
      ))
    } catch (error) {
      console.error('Failed to toggle notifications:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#00FF88'
      case 'away': return '#FFB800'
      case 'offline': return '#666666'
      default: return '#666666'
    }
  }

  const formatLastActive = (date) => {
    if (!date) return 'Never'
    const diff = Date.now() - date.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const filteredData = () => {
    let data = []
    switch (activeTab) {
      case 'friends': data = friends; break
      case 'following': data = following; break
      case 'followers': data = followers; break
      case 'requests': data = requests; break
      case 'suggestions': data = suggestions; break
      default: data = friends
    }

    if (!searchQuery) return data

    return data.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const renderDashboard = () => (
    <div className="social-dashboard">
      <div className="dashboard-stats">
        <div className="stat-card">
          <Users size={24} />
          <div className="stat-info">
            <span className="stat-value">{realTimeStats.followersCount || friends.length}</span>
            <span className="stat-label">Followers</span>
          </div>
        </div>
        <div className="stat-card">
          <Eye size={24} />
          <div className="stat-info">
            <span className="stat-value">{realTimeStats.followingCount || following.length}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck size={24} />
          <div className="stat-info">
            <span className="stat-value">{realTimeStats.friendsCount || friends.length}</span>
            <span className="stat-label">Friends</span>
          </div>
        </div>
        <div className="stat-card">
          <Bell size={24} />
          <div className="stat-info">
            <span className="stat-value">{realTimeStats.requestsCount || requests.length}</span>
            <span className="stat-label">Requests</span>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button 
          className="action-card"
          onClick={() => setActiveView('lists')}
        >
          <Users size={32} />
          <h3>Manage Connections</h3>
          <p>View and manage your followers, following, and friends</p>
        </button>
        
        <button 
          className="action-card"
          onClick={() => setActiveView('requests')}
        >
          <UserPlus size={32} />
          <h3>Friend Requests</h3>
          <p>Review pending friend requests and invitations</p>
          {requests.length > 0 && <span className="notification-badge">{requests.length}</span>}
        </button>
        
        <button 
          className="action-card"
          onClick={() => setActiveView('suggestions')}
        >
          <Sparkles size={32} />
          <h3>Discover People</h3>
          <p>Find interesting people to connect with</p>
        </button>
        
        <button 
          className="action-card"
          onClick={() => setActiveView('activity')}
        >
          <Activity size={32} />
          <h3>Activity Feed</h3>
          <p>See what your network is up to</p>
        </button>
        
        <button 
          className="action-card"
          onClick={() => setActiveView('analytics')}
        >
          <BarChart3 size={32} />
          <h3>Social Analytics</h3>
          <p>Insights into your social network performance</p>
        </button>
        
        <button 
          className="action-card"
          onClick={() => setActiveView('privacy')}
        >
          <Settings size={32} />
          <h3>Privacy & Safety</h3>
          <p>Manage your privacy settings and blocked users</p>
        </button>
      </div>
    </div>
  )

  const renderMobileNavigation = () => (
    <div className="mobile-navigation">
      <button 
        className="mobile-nav-toggle"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        <MoreVertical size={20} />
        Menu
      </button>
      
      {showMobileMenu && (
        <div className="mobile-menu">
          <button onClick={() => { setActiveView('dashboard'); setShowMobileMenu(false) }}>Dashboard</button>
          <button onClick={() => { setActiveView('lists'); setShowMobileMenu(false) }}>Connections</button>
          <button onClick={() => { setActiveView('requests'); setShowMobileMenu(false) }}>Requests</button>
          <button onClick={() => { setActiveView('suggestions'); setShowMobileMenu(false) }}>Discover</button>
          <button onClick={() => { setActiveView('activity'); setShowMobileMenu(false) }}>Activity</button>
          <button onClick={() => { setActiveView('analytics'); setShowMobileMenu(false) }}>Analytics</button>
          <button onClick={() => { setActiveView('privacy'); setShowMobileMenu(false) }}>Privacy</button>
        </div>
      )}
    </div>
  )

  return (
    <div className="friends-modal enhanced">
      <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="header-title">
            <Users size={24} />
            <h2>Social Hub</h2>
            {isConnected && (
              <div className="realtime-indicator">
                <div className="realtime-dot" />
                <span>Live</span>
              </div>
            )}
          </div>
          
          <div className="header-controls">
            {renderMobileNavigation()}
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* View Content */}
        <div className="friends-content enhanced">
          {activeView === 'dashboard' && renderDashboard()}
          
          {activeView === 'lists' && (
            <SocialListsModal
              userId={currentUser?.id || user?.id}
              onClose={() => setActiveView('dashboard')}
              embedded={true}
            />
          )}
          
          {activeView === 'requests' && (
            <FriendRequestSystem
              onClose={() => setActiveView('dashboard')}
              embedded={true}
            />
          )}
          
          {activeView === 'suggestions' && (
            <FriendSuggestions
              onClose={() => setActiveView('dashboard')}
              embedded={true}
              showHeader={false}
            />
          )}
          
          {activeView === 'activity' && (
            <SocialActivityFeed
              onClose={() => setActiveView('dashboard')}
              embedded={true}
            />
          )}
          
          {activeView === 'analytics' && (
            <SocialAnalytics
              onClose={() => setActiveView('dashboard')}
              userId={currentUser?.id || user?.id}
            />
          )}
          
          {activeView === 'privacy' && (
            <SocialPrivacySettings
              onClose={() => setActiveView('dashboard')}
            />
          )}
          
          {activeView === 'graph' && (
            <SocialGraphVisualization
              onClose={() => setActiveView('dashboard')}
              userId={currentUser?.id || user?.id}
            />
          )}
        </div>

      </div>
    </div>
  )
}



export default FriendsSystem