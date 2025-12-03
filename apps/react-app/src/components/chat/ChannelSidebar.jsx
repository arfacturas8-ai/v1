import React, { useState, useCallback, useMemo } from 'react'
import { 
  Hash, Volume2, Lock, Users, Settings, Plus, ChevronDown, ChevronRight,
  Mic, MicOff, Headphones, Phone, Video, Crown, Shield, User,
  MessageCircle, Search, Bell, BellOff, MoreHorizontal, UserPlus
} from 'lucide-react'

/**
 * ChannelSidebar - Discord-style server and channel navigation
 * Features: Server switching, channel organization, voice/text channels, DMs, user status
 */
function ChannelSidebar({
  servers = [],
  channels = [],
  directMessages = [],
  currentServer,
  currentChannel,
  onServerChange,
  onChannelChange,
  onVoiceChannelJoin,
  onDirectMessageSelect,
  onToggleCollapse,
  user,
  onlineUsers = new Map(),
  collapsed = false,
  className = ''
}) {
  // State
  const [expandedCategories, setExpandedCategories] = useState(new Set(['text-channels', 'voice-channels', 'direct-messages']))
  const [hoveredChannel, setHoveredChannel] = useState(null)
  const [showServerTooltip, setShowServerTooltip] = useState(null)
  const [userSettings, setUserSettings] = useState({
    muted: false,
    deafened: false,
    status: 'online' // online, away, busy, invisible
  })
  const [searchTerm, setSearchTerm] = useState('')

  // Filter and organize channels
  const organizedChannels = useMemo(() => {
    const currentServerChannels = channels.filter(channel => 
      channel.serverId === currentServer
    )

    const categories = {
      'text-channels': currentServerChannels.filter(ch => ch.type === 'text'),
      'voice-channels': currentServerChannels.filter(ch => ch.type === 'voice'),
      'announcement-channels': currentServerChannels.filter(ch => ch.type === 'announcement')
    }

    return categories
  }, [channels, currentServer])

  // Filter DMs by search
  const filteredDirectMessages = useMemo(() => {
    if (!searchTerm) return directMessages
    return directMessages.filter(dm => 
      dm.participant?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dm.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [directMessages, searchTerm])

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  // Get user status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'invisible': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  // Get channel icon
  const getChannelIcon = (channel) => {
    if (channel.type === 'voice') return Volume2
    if (channel.private) return Lock
    return Hash
  }

  // Format last seen time
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

  // Current server data
  const currentServerData = servers.find(s => s.id === currentServer)

  if (collapsed) {
    return (
      <div style={{
  width: '64px',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '12px',
  paddingBottom: '12px'
}}>
        {/* Server Icons */}
        {servers.map(server => (
          <button
            key={server.id}
            onClick={() => onServerChange(server.id)}
            onMouseEnter={() => setShowServerTooltip(server.id)}
            onMouseLeave={() => setShowServerTooltip(null)}
            style={{
  width: '48px',
  height: '48px',
  borderRadius: '24px',
  position: 'relative',
  background: 'rgba(22, 27, 34, 0.6)'
}}
          >
            {server.icon ? (
              <img src={server.icon} alt={server.name} style={{
  width: '100%',
  height: '100%'
}} />
            ) : (
              <span style={{
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                {server.name.charAt(0).toUpperCase()}
              </span>
            )}
            
            {/* Server tooltip */}
            {showServerTooltip === server.id && (
              <div style={{
  position: 'absolute',
  color: '#ffffff',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                {server.name}
              </div>
            )}
          </button>
        ))}
        
        {/* Expand button */}
        <button
          onClick={onToggleCollapse}
          style={{
  width: '48px',
  height: '48px',
  borderRadius: '24px',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
        >
          <ChevronRight style={{
  width: '16px',
  height: '16px',
  color: '#ffffff'
}} />
        </button>
      </div>
    )
  }

  return (
    <div style={{
  width: '240px',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
}}>
      {/* Server Header */}
      <div style={{
  height: '48px',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: '16px',
  paddingRight: '16px'
}}>
        <h1 style={{
  color: '#ffffff',
  fontWeight: '600'
}}>
          {currentServerData?.name || 'CRYB Server'}
        </h1>
        <button
          onClick={onToggleCollapse}
          style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
        >
          <ChevronDown style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />
        </button>
      </div>

      {/* Content */}
      <div style={{
  flex: '1'
}}>
        {/* Search */}
        <div style={{
  padding: '8px'
}}>
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
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
  width: '100%',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  paddingLeft: '36px',
  paddingRight: '36px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff'
}}
            />
          </div>
        </div>

        {/* Text Channels */}
        <div style={{
  paddingLeft: '8px',
  paddingRight: '8px'
}}>
          <button
            onClick={() => toggleCategory('text-channels')}
            style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#ffffff',
  paddingTop: '4px',
  paddingBottom: '4px',
  fontWeight: '600'
}}
          >
            <span>Text Channels</span>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <Plus style={{
  width: '16px',
  height: '16px',
  color: '#ffffff'
}} />
              {expandedCategories.has('text-channels') ? (
                <ChevronDown style={{
  width: '16px',
  height: '16px'
}} />
              ) : (
                <ChevronRight style={{
  width: '16px',
  height: '16px'
}} />
              )}
            </div>
          </button>
          
          {expandedCategories.has('text-channels') && (
            <div className="mt-1 space-y-0.5">
              {organizedChannels['text-channels'].map(channel => {
                const Icon = getChannelIcon(channel)
                const isActive = currentChannel === channel.id
                const hasNotifications = channel.unreadCount > 0
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => onChannelChange(channel.id)}
                    onMouseEnter={() => setHoveredChannel(channel.id)}
                    onMouseLeave={() => setHoveredChannel(null)}
                    style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px',
  position: 'relative',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff'
}}
                  >
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <Icon style={{
  width: '16px',
  height: '16px'
}} />
                      <span className="truncate text-sm">{channel.name}</span>
                    </div>
                    
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      {hasNotifications && (
                        <span style={{
  color: '#ffffff',
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%',
  textAlign: 'center'
}}>
                          {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                        </span>
                      )}
                      
                      {hoveredChannel === channel.id && (
                        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                          <button style={{
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
                            <UserPlus style={{
  width: '12px',
  height: '12px'
}} />
                          </button>
                          <button style={{
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
                            <Settings style={{
  width: '12px',
  height: '12px'
}} />
                          </button>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Voice Channels */}
        <div style={{
  paddingLeft: '8px',
  paddingRight: '8px'
}}>
          <button
            onClick={() => toggleCategory('voice-channels')}
            style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#ffffff',
  paddingTop: '4px',
  paddingBottom: '4px',
  fontWeight: '600'
}}
          >
            <span>Voice Channels</span>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <Plus style={{
  width: '16px',
  height: '16px',
  color: '#ffffff'
}} />
              {expandedCategories.has('voice-channels') ? (
                <ChevronDown style={{
  width: '16px',
  height: '16px'
}} />
              ) : (
                <ChevronRight style={{
  width: '16px',
  height: '16px'
}} />
              )}
            </div>
          </button>
          
          {expandedCategories.has('voice-channels') && (
            <div className="mt-1 space-y-0.5">
              {organizedChannels['voice-channels'].map(channel => {
                const isActive = currentChannel === channel.id
                const connectedUsers = channel.connectedUsers || []
                
                return (
                  <div key={channel.id}>
                    <button
                      onClick={() => onVoiceChannelJoin(channel.id)}
                      style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff'
}}
                    >
                      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <Volume2 style={{
  width: '16px',
  height: '16px'
}} />
                        <span className="text-sm">{channel.name}</span>
                      </div>
                      
                      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        {connectedUsers.length > 0 && (
                          <span style={{
  color: '#A0A0A0'
}}>
                            {connectedUsers.length}
                          </span>
                        )}
                        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                          <button style={{
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
                            <Phone style={{
  width: '12px',
  height: '12px'
}} />
                          </button>
                          <button style={{
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
                            <Video style={{
  width: '12px',
  height: '12px'
}} />
                          </button>
                        </div>
                      </div>
                    </button>
                    
                    {/* Connected users */}
                    {connectedUsers.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {connectedUsers.map(userId => {
                          const userData = onlineUsers.get(userId)
                          return (
                            <div key={userId} style={{
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#A0A0A0'
}}>
                              <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                                <User style={{
  width: '12px',
  height: '12px'
}} />
                              </div>
                              <span>{userData?.username || 'Unknown'}</span>
                              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                                {userData?.muted && <MicOff style={{
  width: '12px',
  height: '12px'
}} />}
                                {userData?.deafened && <Headphones style={{
  width: '12px',
  height: '12px'
}} />}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Direct Messages */}
        <div style={{
  paddingLeft: '8px',
  paddingRight: '8px'
}}>
          <button
            onClick={() => toggleCategory('direct-messages')}
            style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#ffffff',
  paddingTop: '4px',
  paddingBottom: '4px',
  fontWeight: '600'
}}
          >
            <span>Direct Messages</span>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <Plus style={{
  width: '16px',
  height: '16px',
  color: '#ffffff'
}} />
              {expandedCategories.has('direct-messages') ? (
                <ChevronDown style={{
  width: '16px',
  height: '16px'
}} />
              ) : (
                <ChevronRight style={{
  width: '16px',
  height: '16px'
}} />
              )}
            </div>
          </button>
          
          {expandedCategories.has('direct-messages') && (
            <div className="mt-1 space-y-0.5">
              {filteredDirectMessages.map(dm => {
                const participant = dm.participant
                const userStatus = onlineUsers.get(participant?.id)
                const hasUnread = dm.unreadCount > 0
                
                return (
                  <button
                    key={dm.id}
                    onClick={() => onDirectMessageSelect(dm.id)}
                    style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff'
}}
                  >
                    <div style={{
  position: 'relative'
}}>
                      <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                        {participant?.avatar ? (
                          <img src={participant.avatar} alt={participant.username} style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}} />
                        ) : (
                          <span style={{
  fontWeight: '500'
}}>
                            {participant?.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div style={{
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}} />
                    </div>
                    
                    <div style={{
  flex: '1'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                        <span style={{
  fontWeight: '500'
}}>
                          {participant?.username || 'Unknown User'}
                        </span>
                        {hasUnread && (
                          <span style={{
  color: '#ffffff',
  paddingLeft: '4px',
  paddingRight: '4px',
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '50%'
}}>
                            {dm.unreadCount}
                          </span>
                        )}
                      </div>
                      {dm.lastMessage && (
                        <div style={{
  display: 'flex',
  alignItems: 'center',
  color: '#A0A0A0'
}}>
                          <span className="truncate">
                            {dm.lastMessage.content || 'Attachment'}
                          </span>
                          <span>•</span>
                          <span>{formatLastSeen(dm.lastMessage.timestamp)}</span>
                        </div>
                      )}
                      {userStatus?.activity && (
                        <div style={{
  color: '#A0A0A0'
}}>
                          {userStatus.activity}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Panel */}
      <div style={{
  height: '64px',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px'
}}>
        <div style={{
  position: 'relative'
}}>
          <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}} />
            ) : (
              <span style={{
  color: '#ffffff',
  fontWeight: '500'
}}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div style={{
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}} />
        </div>
        
        <div style={{
  flex: '1'
}}>
          <div style={{
  color: '#ffffff',
  fontWeight: '500'
}}>
            {user?.username || 'Anonymous'}
          </div>
          <div style={{
  color: '#A0A0A0'
}}>
            #{user?.discriminator || '0000'}
          </div>
        </div>
        
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <button
            onClick={() => setUserSettings(prev => ({ ...prev, muted: !prev.muted }))}
            style={{
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff'
}}
          >
            {userSettings.muted ? <MicOff style={{
  width: '16px',
  height: '16px'
}} /> : <Mic style={{
  width: '16px',
  height: '16px'
}} />}
          </button>
          
          <button
            onClick={() => setUserSettings(prev => ({ ...prev, deafened: !prev.deafened }))}
            style={{
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff'
}}
          >
            <Headphones style={{
  width: '16px',
  height: '16px'
}} />
          </button>
          
          <button style={{
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff'
}}>
            <Settings style={{
  width: '16px',
  height: '16px'
}} />
          </button>
        </div>
      </div>
    </div>
  )
}



export default ChannelSidebar