import React from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { 
  Home, TrendingUp, Clock, Star, Award, Settings, Users, BarChart3, 
  Shield, ChevronLeft, Plus, Bell, Share2, Bookmark, Flag, MoreHorizontal
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'

function CommunityNavigation() {
  const { communityName } = useParams()
  const location = useLocation()
  const { user } = useAuth()

  // Don't show community navigation if not in a community
  if (!location.pathname.startsWith('/c/')) {
    return null
  }

  // Mock community data - in real app this would come from API
  const community = {
    name: communityName || 'technology',
    displayName: 'Technology',
    description: 'The latest in tech news and discussions',
    memberCount: 125400,
    onlineCount: 2340,
    isJoined: true,
    isModerator: false,
    isOwner: false,
    icon: null,
    banner: null,
    rules: 8,
    tags: ['tech', 'programming', 'innovation']
  }

  const communityTabs = [
    { 
      id: 'hot', 
      path: `/c/${community.name}`, 
      label: 'Hot', 
      icon: TrendingUp,
      description: 'Popular posts right now'
    },
    { 
      id: 'new', 
      path: `/c/${community.name}/new`, 
      label: 'New', 
      icon: Clock,
      description: 'Latest posts'
    },
    { 
      id: 'top', 
      path: `/c/${community.name}/top`, 
      label: 'Top', 
      icon: Star,
      description: 'Best posts of all time'
    },
    { 
      id: 'rising', 
      path: `/c/${community.name}/rising`, 
      label: 'Rising', 
      icon: TrendingUp,
      description: 'Posts gaining momentum'
    }
  ]

  const moderatorTabs = [
    { 
      id: 'modqueue', 
      path: `/c/${community.name}/modqueue`, 
      label: 'Mod Queue', 
      icon: Shield,
      description: 'Posts awaiting moderation'
    },
    { 
      id: 'analytics', 
      path: `/c/${community.name}/analytics`, 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Community statistics'
    },
    { 
      id: 'settings', 
      path: `/c/${community.name}/settings`, 
      label: 'Settings', 
      icon: Settings,
      description: 'Community settings'
    }
  ]

  const getCurrentTab = () => {
    const path = location.pathname
    if (path === `/c/${community.name}`) return 'hot'
    if (path.includes('/new')) return 'new'
    if (path.includes('/top')) return 'top'
    if (path.includes('/rising')) return 'rising'
    if (path.includes('/modqueue')) return 'modqueue'
    if (path.includes('/analytics')) return 'analytics'
    if (path.includes('/settings')) return 'settings'
    return 'hot'
  }

  const currentTab = getCurrentTab()

  return (
    <div className="bg-primary border-b border-secondary">
      {/* Community Header */}
      <div style={{
  paddingLeft: '16px',
  paddingRight: '16px'
}}>
        {/* Community Info Bar */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
          {/* Back Button */}
          <Link
            to="/communities"
            style={{
  padding: '8px',
  borderRadius: '12px'
}}
            aria-label="Back to communities"
          >
            <ChevronLeft size={20} className="text-secondary" />
          </Link>

          {/* Community Icon */}
          <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
            {community.displayName.charAt(0)}
          </div>

          {/* Community Details */}
          <div style={{
  flex: '1'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <h1 style={{
  fontWeight: 'bold'
}}>
                c/{community.name}
              </h1>
              {community.isJoined && (
                <div style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  fontWeight: '500',
  borderRadius: '4px'
}}>
                  Joined
                </div>
              )}
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
              <span>{community.memberCount.toLocaleString()} members</span>
              <span>•</span>
              <span>{community.onlineCount.toLocaleString()} online</span>
            </div>
          </div>

          {/* Community Actions */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            {/* Join/Leave Button */}
            <button
              style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  fontWeight: '500',
  color: '#ffffff'
}}
            >
              {community.isJoined ? 'Joined' : 'Join'}
            </button>

            {/* Notification Bell */}
            {community.isJoined && (
              <button style={{
  padding: '8px',
  borderRadius: '12px'
}}>
                <Bell size={18} className="text-secondary" />
              </button>
            )}

            {/* More Options */}
            <button style={{
  padding: '8px',
  borderRadius: '12px'
}}>
              <MoreHorizontal size={18} className="text-secondary" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
          {/* Main Tabs */}
          {communityTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
                style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  fontWeight: '500'
}}
                title={tab.description}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </Link>
            )
          })}

          {/* Separator */}
          {(community.isModerator || community.isOwner) && (
            <div style={{
  height: '32px',
  marginLeft: '8px',
  marginRight: '8px'
}} />
          )}

          {/* Moderator Tabs */}
          {(community.isModerator || community.isOwner) && moderatorTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
                style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  fontWeight: '500'
}}
                title={tab.description}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </Link>
            )
          })}

          {/* Create Post Button */}
          <div className="ml-auto pl-4">
            <Link
              to={`/submit?community=${community.name}`}
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px',
  fontWeight: '500'
}}
            >
              <Plus size={16} />
              <span style={{
  display: 'none'
}}>Create Post</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Community Quick Stats Bar (Mobile) */}
      <div className="md:hidden bg-tertiary border-t border-secondary">
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
              <div>
                <span style={{
  fontWeight: 'bold'
}}>{community.memberCount.toLocaleString()}</span>
                <span className="text-tertiary ml-1">members</span>
              </div>
              <div>
                <span style={{
  fontWeight: 'bold'
}}>{community.onlineCount.toLocaleString()}</span>
                <span className="text-tertiary ml-1">online</span>
              </div>
              <div>
                <span style={{
  fontWeight: 'bold'
}}>{community.rules}</span>
                <span className="text-tertiary ml-1">rules</span>
              </div>
            </div>
            
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              {community.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



export default CommunityNavigation