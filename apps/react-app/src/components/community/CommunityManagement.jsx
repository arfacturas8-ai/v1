import React, { useState, useEffect } from 'react'
import { 
  Users, Settings, BarChart3, Shield, Calendar, 
  UserPlus, Ban, Crown, Star, AlertTriangle,
  TrendingUp, Activity, MessageSquare, Heart,
  Clock, Filter, Search, MoreVertical, Check, X
} from 'lucide-react'
import communityService, { COMMUNITY_ROLES, COMMUNITY_PERMISSIONS } from '../../services/communityService'
import socketService from '../../services/socket'


export default function CommunityManagement({ communityId, currentUser, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [community, setCommunity] = useState(null)
  const [members, setMembers] = useState([])
  const [moderationQueue, setModerationQueue] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  // Permission checks
  const [permissions, setPermissions] = useState({})
  const canManageCommunity = permissions[COMMUNITY_PERMISSIONS.MANAGE_COMMUNITY]
  const canManageMembers = permissions[COMMUNITY_PERMISSIONS.MANAGE_MEMBERS]
  const canModerateContent = permissions[COMMUNITY_PERMISSIONS.MODERATE_CONTENT]

  useEffect(() => {
    loadCommunityData()
    loadPermissions()
    
    // Set up real-time updates
    socketService.on('community_updated', handleCommunityUpdate)
    socketService.on('member_joined', handleMemberJoined)
    socketService.on('member_left', handleMemberLeft)
    socketService.on('moderation_queue_updated', handleModerationUpdate)

    return () => {
      socketService.off('community_updated', handleCommunityUpdate)
      socketService.off('member_joined', handleMemberJoined)
      socketService.off('member_left', handleMemberLeft)
      socketService.off('moderation_queue_updated', handleModerationUpdate)
    }
  }, [communityId])

  const loadCommunityData = async () => {
    try {
      setLoading(true)
      const [communityRes, membersRes, analyticsRes, eventsRes] = await Promise.all([
        communityService.getCommunity(communityId),
        communityService.getCommunityMembers(communityId),
        communityService.getCommunityAnalytics(communityId),
        communityService.getCommunityEvents(communityId)
      ])

      if (communityRes.success) setCommunity(communityRes.community)
      if (membersRes.success) setMembers(membersRes.members)
      if (analyticsRes.success) setAnalytics(analyticsRes.analytics)
      if (eventsRes.success) setEvents(eventsRes.events)

      if (canModerateContent) {
        const queueRes = await communityService.getModerationQueue(communityId)
        if (queueRes.success) setModerationQueue(queueRes.queue)
      }
    } catch (error) {
      console.error('Failed to load community data:', error)
      setError('Failed to load community data')
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      const result = await communityService.getCommunityPermissions(communityId)
      if (result.success) {
        setPermissions(result.permissions)
      }
    } catch (error) {
      console.error('Failed to load permissions:', error)
    }
  }

  // Real-time event handlers
  const handleCommunityUpdate = (updatedCommunity) => {
    if (updatedCommunity.id === communityId) {
      setCommunity(updatedCommunity)
    }
  }

  const handleMemberJoined = (data) => {
    if (data.communityId === communityId) {
      setMembers(prev => [...prev, data.member])
    }
  }

  const handleMemberLeft = (data) => {
    if (data.communityId === communityId) {
      setMembers(prev => prev.filter(m => m.id !== data.userId))
    }
  }

  const handleModerationUpdate = (data) => {
    if (data.communityId === communityId) {
      setModerationQueue(prev => prev.filter(item => item.id !== data.itemId))
    }
  }

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const result = await communityService.updateMemberRole(communityId, userId, newRole)
      if (result.success) {
        setMembers(prev => prev.map(member => 
          member.id === userId ? { ...member, role: newRole } : member
        ))
      }
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const handleBanMember = async (userId, reason) => {
    try {
      const result = await communityService.banMember(communityId, userId, reason)
      if (result.success) {
        setMembers(prev => prev.filter(m => m.id !== userId))
      }
    } catch (error) {
      console.error('Failed to ban member:', error)
    }
  }

  const handleModerationAction = async (itemId, action, reason = '') => {
    try {
      const result = await communityService.moderateContent(communityId, itemId, action, reason)
      if (result.success) {
        setModerationQueue(prev => prev.filter(item => item.id !== itemId))
      }
    } catch (error) {
      console.error('Failed to moderate content:', error)
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || member.role === filterRole
    
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role) => {
    switch (role) {
      case COMMUNITY_ROLES.OWNER: return <Crown className="role-icon owner" size={16} />
      case COMMUNITY_ROLES.ADMIN: return <Star className="role-icon admin" size={16} />
      case COMMUNITY_ROLES.MODERATOR: return <Shield className="role-icon moderator" size={16} />
      default: return <Users className="role-icon member" size={16} />
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users, badge: members.length },
    { id: 'moderation', label: 'Moderation', icon: Shield, badge: moderationQueue.length },
    { id: 'events', label: 'Events', icon: Calendar, badge: events.length },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  if (loading) {
    return (
      <div className="community-management">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading community management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="community-management">
      <div className="management-header">
        <div className="header-info">
          <div className="community-avatar">
            <img src={community?.icon || '/default-community.png'} alt={community?.name} />
          </div>
          <div className="community-details">
            <h1>{community?.displayName}</h1>
            <p>c/{community?.name}</p>
            <div className="community-stats">
              <span>{members.length} members</span>
              <span>•</span>
              <span>{analytics?.totalPosts || 0} posts</span>
              <span>•</span>
              <span>Created {new Date(community?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="management-tabs">
        {tabs.map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <TabIcon size={18} />
              {tab.label}
              {tab.badge && <span className="badge">{tab.badge}</span>}
            </button>
          )
        })}
      </div>

      <div className="management-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <Users size={20} />
                  <span>Total Members</span>
                </div>
                <div className="stat-value">{members.length}</div>
                <div className="stat-change positive">
                  +{analytics?.memberGrowth || 0}% this month
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <MessageSquare size={20} />
                  <span>Posts</span>
                </div>
                <div className="stat-value">{analytics?.totalPosts || 0}</div>
                <div className="stat-change positive">
                  +{analytics?.postGrowth || 0}% this week
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <Activity size={20} />
                  <span>Daily Active</span>
                </div>
                <div className="stat-value">{analytics?.dailyActive || 0}</div>
                <div className="stat-change">
                  {analytics?.activeChange >= 0 ? '+' : ''}{analytics?.activeChange || 0}%
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <TrendingUp size={20} />
                  <span>Engagement Rate</span>
                </div>
                <div className="stat-value">{analytics?.engagementRate || 0}%</div>
                <div className="stat-change positive">
                  +{analytics?.engagementGrowth || 0}% this week
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {analytics?.recentActivity?.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'join' && <UserPlus size={16} />}
                      {activity.type === 'post' && <MessageSquare size={16} />}
                      {activity.type === 'like' && <Heart size={16} />}
                    </div>
                    <div className="activity-content">
                      <span>{activity.description}</span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="members-tab">
            <div className="members-controls">
              <div className="search-bar">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="role-filter"
              >
                <option value="all">All Roles</option>
                <option value={COMMUNITY_ROLES.OWNER}>Owners</option>
                <option value={COMMUNITY_ROLES.ADMIN}>Admins</option>
                <option value={COMMUNITY_ROLES.MODERATOR}>Moderators</option>
                <option value={COMMUNITY_ROLES.MEMBER}>Members</option>
              </select>
              {canManageMembers && (
                <button className="invite-btn">
                  <UserPlus size={18} />
                  Invite Members
                </button>
              )}
            </div>

            <div className="members-list">
              {filteredMembers.map(member => (
                <div key={member.id} className="member-card">
                  <div className="member-info">
                    <img src={member.avatar || '/default-avatar.png'} alt={member.username} />
                    <div className="member-details">
                      <div className="member-name">
                        {getRoleIcon(member.role)}
                        <span>{member.displayName || member.username}</span>
                      </div>
                      <div className="member-meta">
                        @{member.username} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {canManageMembers && member.id !== currentUser.id && (
                    <div className="member-actions">
                      <select 
                        value={member.role}
                        onChange={(e) => handleRoleUpdate(member.id, e.target.value)}
                        className="role-select"
                      >
                        <option value={COMMUNITY_ROLES.MEMBER}>Member</option>
                        <option value={COMMUNITY_ROLES.MODERATOR}>Moderator</option>
                        <option value={COMMUNITY_ROLES.ADMIN}>Admin</option>
                      </select>
                      <button 
                        className="ban-btn"
                        onClick={() => handleBanMember(member.id, 'Banned by administrator')}
                      >
                        <Ban size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && canModerateContent && (
          <div className="moderation-tab">
            <div className="moderation-header">
              <h3>Moderation Queue</h3>
              <div className="queue-stats">
                <span>{moderationQueue.length} items pending</span>
              </div>
            </div>

            <div className="moderation-queue">
              {moderationQueue.map(item => (
                <div key={item.id} className="moderation-item">
                  <div className="item-content">
                    <div className="item-type">
                      {item.type === 'post' && <MessageSquare size={16} />}
                      {item.type === 'comment' && <MessageSquare size={16} />}
                      {item.type === 'report' && <AlertTriangle size={16} />}
                      <span>{item.type}</span>
                    </div>
                    <div className="item-details">
                      <p>{item.content}</p>
                      <div className="item-meta">
                        By @{item.author} • {new Date(item.createdAt).toLocaleDateString()}
                        {item.reports && <span> • {item.reports} reports</span>}
                      </div>
                    </div>
                  </div>
                  <div className="moderation-actions">
                    <button 
                      className="approve-btn"
                      onClick={() => handleModerationAction(item.id, 'approve')}
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => handleModerationAction(item.id, 'remove', 'Removed by moderator')}
                    >
                      <X size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {moderationQueue.length === 0 && (
                <div className="empty-queue">
                  <Shield size={48} />
                  <p>No items in moderation queue</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="events-tab">
            <div className="events-header">
              <h3>Community Events</h3>
              <button className="create-event-btn">
                <Calendar size={18} />
                Create Event
              </button>
            </div>

            <div className="events-list">
              {events.map(event => (
                <div key={event.id} className="event-card">
                  <div className="event-date">
                    <div className="event-month">{new Date(event.startDate).toLocaleDateString('en', { month: 'short' })}</div>
                    <div className="event-day">{new Date(event.startDate).getDate()}</div>
                  </div>
                  <div className="event-details">
                    <h4>{event.title}</h4>
                    <p>{event.description}</p>
                    <div className="event-meta">
                      <Clock size={14} />
                      {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString()}
                      <span>•</span>
                      <Users size={14} />
                      {event.attendees || 0} attending
                    </div>
                  </div>
                  <div className="event-actions">
                    <MoreVertical size={16} />
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="empty-events">
                  <Calendar size={48} />
                  <p>No events scheduled</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && canManageCommunity && (
          <div className="settings-tab">
            <div className="settings-section">
              <h3>Community Settings</h3>
              <p>Manage your community's basic information and preferences.</p>
              <button className="settings-btn">Edit Community Info</button>
            </div>

            <div className="settings-section">
              <h3>Privacy & Access</h3>
              <p>Control who can join and view your community.</p>
              <button className="settings-btn">Manage Privacy</button>
            </div>

            <div className="settings-section">
              <h3>Rules & Guidelines</h3>
              <p>Set community rules and posting guidelines.</p>
              <button className="settings-btn">Edit Rules</button>
            </div>

            <div className="settings-section">
              <h3>Appearance</h3>
              <p>Customize your community's theme and branding.</p>
              <button className="settings-btn">Customize Appearance</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
