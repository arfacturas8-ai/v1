import React, { useState, useEffect } from 'react'
import {
  Users, UserPlus, UserMinus, UserCheck, Search, Filter,
  Star, Crown, Shield, Heart, MessageCircle, Eye, EyeOff,
  Settings, MoreHorizontal, Check, X, Bell, BellOff,
  Activity, Calendar, Map, Link, Github, Twitter
} from 'lucide-react'

const FollowerSystem = ({ userId, type = 'followers', onClose }) => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // all, mutual, verified, premium, active
  const [sortBy, setSortBy] = useState('recent') // recent, karma, alphabetical
  const [relationships, setRelationships] = useState({})
  const [followRequests, setFollowRequests] = useState([])
  const [showRequests, setShowRequests] = useState(false)

  useEffect(() => {
    fetchUsers()
    if (type === 'followers') {
      fetchFollowRequests()
    }
  }, [userId, type])

  useEffect(() => {
    filterAndSortUsers()
  }, [users, searchQuery, filter, sortBy])

  const fetchUsers = async () => {
    try {
      const endpoint = type === 'followers' 
        ? `/api/users/${userId}/followers`
        : `/api/users/${userId}/following`
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        
        // Fetch relationships for each user
        const relationshipData = {}
        for (const user of data.users || []) {
          try {
            const relResponse = await fetch(`/api/users/${user.id}/relationship`)
            if (relResponse.ok) {
              const relData = await relResponse.json()
              relationshipData[user.id] = relData
            }
          } catch (error) {
            console.error(`Failed to fetch relationship for user ${user.id}:`, error)
          }
        }
        setRelationships(relationshipData)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      // Mock data for demo
      const mockUsers = [
        {
          id: '1',
          username: 'cryptowhale',
          displayName: 'Crypto Whale',
          avatar: null,
          bio: 'DeFi enthusiast and early blockchain adopter',
          isVerified: true,
          isPremium: true,
          karma: 25430,
          followers: 15642,
          following: 892,
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          followedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          mutualFollowers: 23,
          location: 'New York, NY'
        },
        {
          id: '2',
          username: 'nftcollector',
          displayName: 'NFT Collector',
          avatar: null,
          bio: 'Collecting digital art and building Web3 communities',
          isVerified: false,
          isPremium: true,
          karma: 8950,
          followers: 3421,
          following: 567,
          lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          followedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          mutualFollowers: 8
        },
        {
          id: '3',
          username: 'defidev',
          displayName: 'DeFi Developer',
          avatar: null,
          bio: 'Building the future of decentralized finance',
          isVerified: true,
          isPremium: false,
          karma: 12340,
          followers: 5678,
          following: 234,
          lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          followedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          mutualFollowers: 15,
          socialLinks: {
            github: 'https://github.com/defidev',
            twitter: 'https://twitter.com/defidev'
          }
        }
      ]
      setUsers(mockUsers)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowRequests = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/follow-requests`)
      if (response.ok) {
        const data = await response.json()
        setFollowRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to fetch follow requests:', error)
      // Mock follow requests
      setFollowRequests([
        {
          id: 'req1',
          user: {
            id: '4',
            username: 'newuser',
            displayName: 'New User',
            avatar: null,
            karma: 45,
            followers: 12,
            requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      ])
    }
  }

  const filterAndSortUsers = () => {
    let filtered = [...users]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    switch (filter) {
      case 'mutual':
        filtered = filtered.filter(user => user.mutualFollowers > 0)
        break
      case 'verified':
        filtered = filtered.filter(user => user.isVerified)
        break
      case 'premium':
        filtered = filtered.filter(user => user.isPremium)
        break
      case 'active':
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        filtered = filtered.filter(user => new Date(user.lastActive).getTime() > oneDayAgo)
        break
    }

    // Apply sorting
    switch (sortBy) {
      case 'karma':
        filtered.sort((a, b) => (b.karma || 0) - (a.karma || 0))
        break
      case 'alphabetical':
        filtered.sort((a, b) => a.displayName.localeCompare(b.displayName))
        break
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.followedAt || 0).getTime() - new Date(a.followedAt || 0).getTime())
        break
    }

    setFilteredUsers(filtered)
  }

  const handleFollow = async (targetUserId) => {
    try {
      const response = await fetch(`/api/users/${targetUserId}/follow`, { method: 'POST' })
      if (response.ok) {
        setRelationships(prev => ({
          ...prev,
          [targetUserId]: { ...prev[targetUserId], isFollowing: true }
        }))
      }
    } catch (error) {
      console.error('Failed to follow user:', error)
    }
  }

  const handleUnfollow = async (targetUserId) => {
    try {
      const response = await fetch(`/api/users/${targetUserId}/unfollow`, { method: 'POST' })
      if (response.ok) {
        setRelationships(prev => ({
          ...prev,
          [targetUserId]: { ...prev[targetUserId], isFollowing: false }
        }))
        // Remove from current list if viewing following
        if (type === 'following') {
          setUsers(prev => prev.filter(user => user.id !== targetUserId))
        }
      }
    } catch (error) {
      console.error('Failed to unfollow user:', error)
    }
  }

  const handleFollowRequest = async (requestId, action) => {
    try {
      const response = await fetch(`/api/follow-requests/${requestId}/${action}`, { method: 'POST' })
      if (response.ok) {
        setFollowRequests(prev => prev.filter(req => req.id !== requestId))
        if (action === 'accept') {
          // Add user to followers list
          const request = followRequests.find(req => req.id === requestId)
          if (request) {
            setUsers(prev => [request.user, ...prev])
          }
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} follow request:`, error)
    }
  }

  const formatLastActive = (timestamp) => {
    const now = Date.now()
    const diff = now - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 5) return 'Active now'
    if (minutes < 60) return `Active ${minutes}m ago`
    if (hours < 24) return `Active ${hours}h ago`
    if (days < 7) return `Active ${days}d ago`
    return 'Active more than a week ago'
  }

  const UserCard = ({ user, isRequest = false, requestId = null }) => {
    const relationship = relationships[user.id] || {}
    const isOnline = new Date(user.lastActive).getTime() > Date.now() - 5 * 60 * 1000

    return (
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
        {/* Avatar */}
        <div style={{
  position: 'relative'
}}>
          <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  overflow: 'hidden'
}}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.displayName} style={{
  width: '100%',
  height: '100%'
}} />
            ) : (
              <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <Users style={{
  width: '24px',
  height: '24px'
}} />
              </div>
            )}
          </div>
          {isOnline && (
            <div style={{
  position: 'absolute',
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}}></div>
          )}
          {user.isPremium && (
            <Crown style={{
  position: 'absolute',
  width: '16px',
  height: '16px'
}} />
          )}
        </div>

        {/* User Info */}
        <div style={{
  flex: '1'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <h3 style={{
  fontWeight: '500'
}}>{user.displayName}</h3>
            {user.isVerified && (
              <Shield style={{
  width: '16px',
  height: '16px'
}} />
            )}
          </div>
          <p className="text-sm text-muted/70 mb-1">@{user.username}</p>
          
          {user.bio && (
            <p className="text-xs text-muted/60 line-clamp-1 mb-2">{user.bio}</p>
          )}

          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
            <span>{user.karma?.toLocaleString()} karma</span>
            <span>{user.followers?.toLocaleString()} followers</span>
            {user.mutualFollowers > 0 && (
              <span className="text-accent">{user.mutualFollowers} mutual</span>
            )}
          </div>

          <div className="text-xs text-muted/50 mt-1">
            {formatLastActive(user.lastActive)}
          </div>
        </div>

        {/* Social Links */}
        {user.socialLinks && (
          <div style={{
  display: 'flex',
  gap: '8px'
}}>
            {user.socialLinks.github && (
              <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted/60 hover:text-primary">
                <Github style={{
  width: '16px',
  height: '16px'
}} />
              </a>
            )}
            {user.socialLinks.twitter && (
              <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted/60 hover:text-primary">
                <Twitter style={{
  width: '16px',
  height: '16px'
}} />
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
          {isRequest ? (
            <>
              <button
                onClick={() => handleFollowRequest(requestId, 'accept')}
                style={{
  padding: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
                title="Accept"
              >
                <Check style={{
  width: '16px',
  height: '16px'
}} />
              </button>
              <button
                onClick={() => handleFollowRequest(requestId, 'reject')}
                style={{
  padding: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
                title="Reject"
              >
                <X style={{
  width: '16px',
  height: '16px'
}} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => window.location.href = `/u/${user.username}`}
                style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
              >
                View Profile
              </button>
              
              {relationship.isFollowing ? (
                <button
                  onClick={() => handleUnfollow(user.id)}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff',
  borderRadius: '12px'
}}
                >
                  Following
                </button>
              ) : (
                <button
                  onClick={() => handleFollow(user.id)}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                >
                  Follow
                </button>
              )}
              
              <button style={{
  padding: '4px'
}}>
                <MoreHorizontal style={{
  width: '16px',
  height: '16px'
}} />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
      <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  width: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}}>
        {/* Header */}
        <div style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              <Users style={{
  width: '24px',
  height: '24px'
}} />
              <div>
                <h2 style={{
  fontWeight: 'bold'
}}>{type}</h2>
                <p className="text-sm text-muted/70">
                  {filteredUsers.length} {type}
                  {type === 'followers' && followRequests.length > 0 && (
                    <span> • {followRequests.length} pending requests</span>
                  )}
                </p>
              </div>
            </div>
            
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              {type === 'followers' && followRequests.length > 0 && (
                <button
                  onClick={() => setShowRequests(!showRequests)}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px'
}}
                >
                  {showRequests ? 'Hide' : 'Show'} Requests ({followRequests.length})
                </button>
              )}
              <button onClick={onClose} style={{
  padding: '8px',
  borderRadius: '12px'
}}>
                <X style={{
  width: '20px',
  height: '20px'
}} />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{
  display: 'flex',
  gap: '16px'
}}>
            <div style={{
  position: 'relative',
  flex: '1'
}}>
              <Search style={{
  position: 'absolute',
  width: '16px',
  height: '16px'
}} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${type}...`}
                style={{
  width: '100%',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
            >
              <option value="all">All {type}</option>
              <option value="mutual">Mutual connections</option>
              <option value="verified">Verified users</option>
              <option value="premium">Premium users</option>
              <option value="active">Recently active</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
            >
              <option value="recent">Most recent</option>
              <option value="karma">Highest karma</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div style={{
  flex: '1',
  padding: '24px'
}}>
          {/* Follow Requests */}
          {showRequests && followRequests.length > 0 && (
            <div className="mb-6">
              <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <Bell style={{
  width: '16px',
  height: '16px'
}} />
                Follow Requests
              </h3>
              <div className="space-y-3">
                {followRequests.map(request => (
                  <UserCard 
                    key={request.id} 
                    user={request.user} 
                    isRequest={true}
                    requestId={request.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Users List */}
          {loading ? (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '256px'
}}>
              <div style={{
  borderRadius: '50%',
  height: '32px',
  width: '32px'
}}></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '256px'
}}>
              <Users style={{
  width: '64px',
  height: '64px'
}} />
              <p>No {type} found</p>
              {searchQuery && (
                <p className="text-sm">Try adjusting your search or filters</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



export default FollowerSystem