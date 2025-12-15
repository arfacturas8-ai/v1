import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Users, Search, Crown, Shield, User, Mic, MicOff, Headphones,
  Phone, Video, Settings, MoreHorizontal, MessageCircle, UserPlus,
  VolumeX, Volume2, Activity, Clock, Gamepad2, Music, Code, Coffee
} from 'lucide-react'

/**
 * UserPresenceSystem - Discord-style member list with presence, roles, and activities
 * Features: Online status, custom activities, role hierarchies, voice states, quick actions
 */
function UserPresenceSystem({
  users = [],
  currentUserId,
  onUserClick,
  onUserMessage,
  onUserCall,
  onUserMute,
  showRoles = true,
  showActivities = true,
  allowModeration = false,
  channelId,
  className = ''
}) {
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, online, away, busy, offline
  const [roleFilter, setRoleFilter] = useState('all')
  const [hoveredUser, setHoveredUser] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState(new Set())
  const [userDetails, setUserDetails] = useState(new Map())
  
  // Role definitions
  const roles = {
    owner: { name: 'Owner', color: '#ff6b6b', icon: Crown, priority: 100 },
    admin: { name: 'Admin', color: '#4ecdc4', icon: Shield, priority: 90 },
    moderator: { name: 'Moderator', color: '#45b7d1', icon: Shield, priority: 80 },
    member: { name: 'Member', color: '#96ceb4', icon: User, priority: 10 }
  }

  // Activity types with icons
  const activityIcons = {
    playing: Gamepad2,
    listening: Music,
    watching: Video,
    streaming: Video,
    coding: Code,
    browsing: Activity,
    working: Coffee,
    custom: Activity
  }

  // Load detailed user data
  useEffect(() => {
    users.forEach(user => {
      if (!userDetails.has(user.id)) {
        loadUserDetails(user.id)
      }
    })
  }, [users])

  // Load user details
  const loadUserDetails = async (userId) => {
    try {
      // Mock API call - replace with actual implementation
      const response = await fetch(`/api/users/${userId}/presence`)
      const data = await response.json()
      
      setUserDetails(prev => new Map(prev.set(userId, data)))
    } catch (error) {
      console.error('Failed to load user details:', error)
      // Mock data for demo
      setUserDetails(prev => new Map(prev.set(userId, {
        joinedAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        roles: ['member'],
        permissions: [],
        activity: generateMockActivity(),
        voiceState: null,
        customStatus: null
      })))
    }
  }

  // Generate mock activity
  const generateMockActivity = () => {
    const activities = [
      { type: 'playing', name: 'Visual Studio Code', details: 'Editing ChatInterface.jsx' },
      { type: 'listening', name: 'Spotify', details: 'Lo-fi Hip Hop Radio' },
      { type: 'watching', name: 'YouTube', details: 'React Best Practices' },
      { type: 'custom', name: 'Building the future' },
      null // No activity
    ]
    
    return activities[Math.floor(Math.random() * activities.length)]
  }

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        if (!user.username?.toLowerCase().includes(term) && 
            !user.displayName?.toLowerCase().includes(term)) {
          return false
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && user.status !== statusFilter) {
        return false
      }
      
      // Role filter
      if (roleFilter !== 'all') {
        const userRoles = userDetails.get(user.id)?.roles || ['member']
        if (!userRoles.includes(roleFilter)) {
          return false
        }
      }
      
      return true
    })
    
    // Sort by role priority, then online status, then alphabetically
    return filtered.sort((a, b) => {
      const aDetails = userDetails.get(a.id)
      const bDetails = userDetails.get(b.id)
      
      // Get highest role priority
      const aRoles = aDetails?.roles || ['member']
      const bRoles = bDetails?.roles || ['member']
      const aPriority = Math.max(...aRoles.map(role => roles[role]?.priority || 0))
      const bPriority = Math.max(...bRoles.map(role => roles[role]?.priority || 0))
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      // Sort by online status
      const statusOrder = { online: 4, away: 3, busy: 2, offline: 1 }
      const aStatusPriority = statusOrder[a.status] || 0
      const bStatusPriority = statusOrder[b.status] || 0
      
      if (aStatusPriority !== bStatusPriority) {
        return bStatusPriority - aStatusPriority
      }
      
      // Sort alphabetically
      return (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '')
    })
  }, [users, searchTerm, statusFilter, roleFilter, userDetails])

  // Group users by status
  const groupedUsers = useMemo(() => {
    const groups = {
      online: [],
      away: [],
      busy: [],
      offline: []
    }
    
    filteredAndSortedUsers.forEach(user => {
      const status = user.status || 'offline'
      if (groups[status]) {
        groups[status].push(user)
      }
    })
    
    return groups
  }, [filteredAndSortedUsers])

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  // Get user's highest role
  const getUserHighestRole = (userId) => {
    const userRoles = userDetails.get(userId)?.roles || ['member']
    let highestRole = 'member'
    let highestPriority = 0
    
    userRoles.forEach(roleId => {
      const role = roles[roleId]
      if (role && role.priority > highestPriority) {
        highestRole = roleId
        highestPriority = role.priority
      }
    })
    
    return roles[highestRole]
  }

  // Handle user actions
  const handleUserSelect = (userId) => {
    onUserClick && onUserClick(userId)
  }

  const handleSendMessage = (userId) => {
    onUserMessage && onUserMessage(userId)
  }

  const handleStartCall = (userId, type = 'voice') => {
    onUserCall && onUserCall(userId, type)
  }

  const handleMuteUser = (userId) => {
    onUserMute && onUserMute(userId)
  }

  // Format last seen
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Unknown'
    
    const now = new Date()
    const lastSeen = new Date(timestamp)
    const diff = now - lastSeen
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  // Render user item
  const renderUser = (user) => {
    const details = userDetails.get(user.id)
    const role = getUserHighestRole(user.id)
    const activity = details?.activity
    const voiceState = details?.voiceState
    const isCurrentUser = user.id === currentUserId
    const isHovered = hoveredUser === user.id
    
    const ActivityIcon = activity ? activityIcons[activity.type] || Activity : null
    const RoleIcon = role.icon
    
    return (
      <div
        key={user.id}
        style={{
  position: 'relative',
  padding: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
        onMouseEnter={() => setHoveredUser(user.id)}
        onMouseLeave={() => setHoveredUser(null)}
        onClick={() => handleUserSelect(user.id)}
      >
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          {/* Avatar with status */}
          <div style={{
  position: 'relative'
}}>
            <div
              style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: user.avatar ? 'transparent' : role.color
}}
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username}
                  style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}}
                />
              ) : (
                <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                  {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Status indicator */}
            <div style={{
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}} />
            
            {/* Voice state indicators */}
            {voiceState && (
              <div style={{
  position: 'absolute',
  borderRadius: '50%'
}}>
                {voiceState.muted ? (
                  <MicOff style={{
  width: '8px',
  height: '8px',
  color: '#ffffff'
}} />
                ) : voiceState.speaking ? (
                  <Mic style={{
  width: '8px',
  height: '8px',
  color: '#ffffff'
}} />
                ) : (
                  <Mic style={{
  width: '8px',
  height: '8px',
  color: '#ffffff'
}} />
                )}
              </div>
            )}
          </div>
          
          {/* User info */}
          <div style={{
  flex: '1'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                {user.displayName || user.username}
              </span>
              
              {/* Role badge */}
              {showRoles && role.priority > 10 && (
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <RoleIcon
                    style={{
  width: '12px',
  height: '12px',
  color: role.color
}}
                  />
                </div>
              )}
              
              {/* Bot badge */}
              {user.bot && (
                <span style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  color: '#ffffff',
  borderRadius: '4px'
}}>
                  BOT
                </span>
              )}
            </div>
            
            {/* Activity or custom status */}
            {showActivities && (activity || details?.customStatus) && (
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                {ActivityIcon && (
                  <ActivityIcon style={{
  width: '12px',
  height: '12px',
  color: '#A0A0A0'
}} />
                )}
                <span style={{
  color: '#A0A0A0'
}}>
                  {details?.customStatus || (activity && `${activity.type} ${activity.name}`)}
                </span>
              </div>
            )}
            
            {/* Last seen for offline users */}
            {user.status === 'offline' && user.lastSeen && (
              <div style={{
  color: '#A0A0A0'
}}>
                Last seen {formatLastSeen(user.lastSeen)}
              </div>
            )}
          </div>
          
          {/* Quick actions */}
          {isHovered && user.id !== currentUserId && (
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSendMessage(user.id)
                }}
                style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                title="Send message"
              >
                <MessageCircle style={{
  width: '12px',
  height: '12px'
}} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartCall(user.id, 'voice')
                }}
                style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                title="Voice call"
              >
                <Phone style={{
  width: '12px',
  height: '12px'
}} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartCall(user.id, 'video')
                }}
                style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                title="Video call"
              >
                <Video style={{
  width: '12px',
  height: '12px'
}} />
              </button>
              
              {allowModeration && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMuteUser(user.id)
                  }}
                  style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                  title="Mute user"
                >
                  <VolumeX style={{
  width: '12px',
  height: '12px'
}} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
      {/* Header */}
      <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <h3 style={{
  fontWeight: '600',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center'
}}>
            <Users style={{
  width: '20px',
  height: '20px'
}} />
            <span>Members</span>
            <span style={{
  color: '#A0A0A0'
}}>
              ({filteredAndSortedUsers.length})
            </span>
          </h3>
          
          <button style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
            <Settings style={{
  width: '16px',
  height: '16px'
}} />
          </button>
        </div>
        
        {/* Search */}
        <div style={{
  position: 'relative'
}}>
          <Search style={{
  position: 'absolute',
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members..."
            style={{
  width: '100%',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
          />
        </div>
        
        {/* Filters */}
        <div style={{
  display: 'flex'
}}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
  flex: '1',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="away">Away</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
          
          {showRoles && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
  flex: '1',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
            >
              <option value="all">All Roles</option>
              {Object.entries(roles).map(([roleId, role]) => (
                <option key={roleId} value={roleId}>{role.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* Members List */}
      <div style={{
  flex: '1'
}}>
        {Object.entries(groupedUsers).map(([status, statusUsers]) => {
          if (statusUsers.length === 0) return null
          
          return (
            <div key={status} className="mb-4">
              <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  fontWeight: '600',
  color: '#A0A0A0',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
                  <span>{status} ({statusUsers.length})</span>
                </div>
              </div>
              
              <div style={{
  paddingLeft: '8px',
  paddingRight: '8px'
}}>
                {statusUsers.map(renderUser)}
              </div>
            </div>
          )
        })}
        
        {filteredAndSortedUsers.length === 0 && (
          <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
            <Users style={{
  width: '48px',
  height: '48px',
  color: '#A0A0A0'
}} />
            <h3 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>No members found</h3>
            <p style={{
  color: '#A0A0A0'
}}>
              {searchTerm ? 'Try adjusting your search' : 'No members match the current filters'}
            </p>
          </div>
        )}
      </div>
      
      {/* Footer with stats */}
      <div style={{
  padding: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#A0A0A0'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
              <span>{groupedUsers.online.length} online</span>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)'
}}></div>
              <span>{users.length} total</span>
            </div>
          </div>
          
          {channelId && (
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <Volume2 style={{
  width: '12px',
  height: '12px'
}} />
              <span>{users.filter(u => userDetails.get(u.id)?.voiceState).length} in voice</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



export default UserPresenceSystem