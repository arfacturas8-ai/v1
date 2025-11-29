import React, { useState, useEffect } from 'react'
import {
  Users, Search, Filter, Crown, Star, Shield,
  UserPlus, Ban, MoreVertical, User, Calendar,
  Mail, MessageCircle, Settings, Copy, Check
} from 'lucide-react'
import communityService, { COMMUNITY_ROLES } from '../../services/communityService'
import socketService from '../../services/socket'
import { useConfirmationDialog } from '../ui/modal'



export default function MemberDirectory({
  communityId,
  currentUser,
  canManageMembers = false,
  canBanMembers = false
}) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('joinDate') // joinDate, name, role, activity
  const [pagination, setPagination] = useState({ page: 1, hasMore: true })
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(null)

  const { confirm, ConfirmationDialog } = useConfirmationDialog()

  useEffect(() => {
    loadMembers(true)
    
    // Set up real-time updates
    socketService.on('member_joined', handleMemberJoined)
    socketService.on('member_left', handleMemberLeft)
    socketService.on('member_role_updated', handleMemberRoleUpdated)
    socketService.on('member_banned', handleMemberBanned)
    
    return () => {
      socketService.off('member_joined', handleMemberJoined)
      socketService.off('member_left', handleMemberLeft)
      socketService.off('member_role_updated', handleMemberRoleUpdated)
      socketService.off('member_banned', handleMemberBanned)
    }
  }, [communityId])

  useEffect(() => {
    if (searchQuery || roleFilter !== 'all' || sortBy !== 'joinDate') {
      loadMembers(true)
    }
  }, [searchQuery, roleFilter, sortBy])

  const loadMembers = async (reset = false) => {
    try {
      setLoading(reset)
      setError(null)
      
      const options = {
        page: reset ? 1 : pagination.page,
        limit: 50,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        sort: sortBy,
        search: searchQuery || undefined
      }
      
      const result = await communityService.getCommunityMembers(communityId, options)
      
      if (result.success) {
        if (reset) {
          setMembers(result.members)
          setPagination({ page: 1, hasMore: result.pagination?.hasMore ?? false })
        } else {
          setMembers(prev => [...prev, ...result.members])
          setPagination(prev => ({ 
            page: prev.page + 1, 
            hasMore: result.pagination?.hasMore ?? false 
          }))
        }
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to load members:', error)
      setError('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  // Real-time event handlers
  const handleMemberJoined = (data) => {
    if (data.communityId === communityId) {
      setMembers(prev => [data.member, ...prev])
    }
  }

  const handleMemberLeft = (data) => {
    if (data.communityId === communityId) {
      setMembers(prev => prev.filter(m => m.id !== data.userId))
    }
  }

  const handleMemberRoleUpdated = (data) => {
    if (data.communityId === communityId) {
      setMembers(prev => prev.map(member => 
        member.id === data.userId 
          ? { ...member, role: data.newRole }
          : member
      ))
    }
  }

  const handleMemberBanned = (data) => {
    if (data.communityId === communityId) {
      setMembers(prev => prev.filter(m => m.id !== data.userId))
    }
  }

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const result = await communityService.updateMemberRole(communityId, userId, newRole)
      if (result.success) {
        setMembers(prev => prev.map(member => 
          member.id === userId ? { ...member, role: newRole } : member
        ))
        setActionMenuOpen(null)
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      setError('Failed to update member role')
    }
  }

  const handleBanMember = async (userId, reason = 'Banned by moderator') => {
    const confirmed = await confirm({
      type: 'error',
      title: 'Ban Member',
      description: 'Are you sure you want to ban this member? This action will remove them from the community.',
      confirmText: 'Ban',
      confirmVariant: 'destructive'
    })

    if (!confirmed) return

    try {
      const result = await communityService.banMember(communityId, userId, reason)
      if (result.success) {
        setMembers(prev => prev.filter(m => m.id !== userId))
        setActionMenuOpen(null)
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to ban member:', error)
      setError('Failed to ban member')
    }
  }

  const handleRemoveMember = async (userId) => {
    const confirmed = await confirm({
      type: 'warning',
      title: 'Remove Member',
      description: 'Are you sure you want to remove this member from the community?',
      confirmText: 'Remove',
      confirmVariant: 'destructive'
    })

    if (!confirmed) return

    try {
      const result = await communityService.removeMember(communityId, userId)
      if (result.success) {
        setMembers(prev => prev.filter(m => m.id !== userId))
        setActionMenuOpen(null)
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
      setError('Failed to remove member')
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case COMMUNITY_ROLES.OWNER:
        return <Crown className="role-icon owner" size={16} />
      case COMMUNITY_ROLES.ADMIN:
        return <Star className="role-icon admin" size={16} />
      case COMMUNITY_ROLES.MODERATOR:
        return <Shield className="role-icon moderator" size={16} />
      default:
        return <User className="role-icon member" size={16} />
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case COMMUNITY_ROLES.OWNER: return '#f59e0b'
      case COMMUNITY_ROLES.ADMIN: return '#a371f7'
      case COMMUNITY_ROLES.MODERATOR: return '#06b6d4'
      default: return '#6b7280'
    }
  }

  const canManageMember = (member) => {
    if (!canManageMembers) return false
    if (member.id === currentUser.id) return false
    
    // Role hierarchy check
    const roleHierarchy = {
      [COMMUNITY_ROLES.OWNER]: 4,
      [COMMUNITY_ROLES.ADMIN]: 3,
      [COMMUNITY_ROLES.MODERATOR]: 2,
      [COMMUNITY_ROLES.MEMBER]: 1
    }
    
    const currentUserLevel = roleHierarchy[currentUser.role] || 0
    const memberLevel = roleHierarchy[member.role] || 0
    
    return currentUserLevel > memberLevel
  }

  if (loading && members.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
          <div className="w-8 h-8 border-3 border-border-primary border-t-accent-primary rounded-full animate-spin mb-4"></div>
          <p>Loading members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="header-info">
          <h2>
            <Users size={24} />
            Community Members
          </h2>
          <p>{members.length} members</p>
        </div>
        
        {canManageMembers && (
          <button 
            className="flex items-center gap-2 bg-accent-primary text-white border-none rounded-lg px-4 py-2.5 cursor-pointer font-medium transition-all hover:bg-accent-dark hover:-translate-y-0.5"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus size={18} />
            Invite Members
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6 items-center flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-border-primary rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-md">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-3 items-center">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-card border border-border-primary rounded-md px-3 py-1.5 text-text-primary text-sm cursor-pointer focus:outline-none focus:border-accent-primary"
          >
            <option value="all">All Roles</option>
            <option value={COMMUNITY_ROLES.OWNER}>Owners</option>
            <option value={COMMUNITY_ROLES.ADMIN}>Admins</option>
            <option value={COMMUNITY_ROLES.MODERATOR}>Moderators</option>
            <option value={COMMUNITY_ROLES.MEMBER}>Members</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-card border border-border-primary rounded-md px-3 py-1.5 text-text-primary text-sm cursor-pointer focus:outline-none focus:border-accent-primary"
          >
            <option value="joinDate">Join Date</option>
            <option value="name">Name</option>
            <option value="role">Role</option>
            <option value="activity">Activity</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5 mb-6">
        {members.map(member => (
          <div key={member.id} className="bg-card border border-border-primary rounded-xl p-5 transition-all relative hover:border-accent-primary/30 hover:shadow-lg hover:-translate-y-0.5">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <img 
                src={member.avatar || '/default-avatar.png'} 
                alt={member.username}
                onError={(e) => {
                  e.target.src = '/default-avatar.png'
                }}
              />
              <div 
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-card" 
                style={{ backgroundColor: getRoleColor(member.role) }}
              >
                {getRoleIcon(member.role)}
              </div>
            </div>

            <div className="text-center mb-4">
              <h3>{member.displayName || member.username}</h3>
              <p className="m-0 mb-2 text-text-secondary text-[13px]">@{member.username}</p>
              <div className="flex flex-col gap-1 items-center">
                <span className="bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-xl text-xs font-medium capitalize">{member.role}</span>
                <span className="flex items-center gap-1 text-text-tertiary text-xs">
                  <Calendar size={12} />
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex justify-around mb-4 pt-3 border-t border-border-primary">
              <div className="text-center">
                <span className="block text-lg font-semibold text-text-primary">{member.postCount || 0}</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider">Posts</span>
              </div>
              <div className="text-center">
                <span className="block text-lg font-semibold text-text-primary">{member.karma || 0}</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider">Karma</span>
              </div>
            </div>

            <div className="flex justify-center gap-2 relative">
              <button 
                className="flex items-center justify-center w-9 h-9 border border-border-primary rounded-lg bg-card text-text-secondary cursor-pointer transition-all hover:bg-accent-primary hover:text-white hover:border-accent-primary"
                title="Send Message"
              >
                <MessageCircle size={16} />
              </button>
              
              {canManageMember(member) && (
                <div className="relative">
                  <button 
                    className="flex items-center justify-center w-9 h-9 border border-border-primary rounded-lg bg-card text-text-secondary cursor-pointer transition-all hover:bg-hover hover:text-text-primary hover:border-accent-primary/30"
                    onClick={() => setActionMenuOpen(
                      actionMenuOpen === member.id ? null : member.id
                    )}
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {actionMenuOpen === member.id && (
                    <div className="absolute top-full right-0 bg-card border border-border-primary rounded-lg py-2 min-w-[180px] z-[100] shadow-lg animate-fadeIn">
                      <div className="py-1">
                        <span className="block px-3 py-1 text-xs font-semibold text-text-secondary uppercase tracking-wider">Change Role</span>
                        {Object.values(COMMUNITY_ROLES).map(role => (
                          role !== member.role && (
                            <button
                              key={role}
                              onClick={() => handleRoleUpdate(member.id, role)}
                              className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-text-primary cursor-pointer text-[13px] text-left transition-all hover:bg-hover"
                            >
                              {getRoleIcon(role)}
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </button>
                          )
                        ))}
                      </div>
                      
                      <div className="h-px bg-border-primary my-1"></div>
                      
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-error-dark cursor-pointer text-[13px] text-left transition-all hover:bg-error/10"
                      >
                        <User size={16} />
                        Remove from Community
                      </button>
                      
                      {canBanMembers && (
                        <button
                          onClick={() => handleBanMember(member.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-error-dark cursor-pointer text-[13px] text-left transition-all hover:bg-error/10"
                        >
                          <Ban size={16} />
                          Ban Member
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {pagination.hasMore && (
        <div className="flex justify-center mt-6">
          <button 
            className="bg-card border border-border-primary rounded-lg px-6 py-3 text-text-primary cursor-pointer font-medium transition-all hover:bg-accent-primary hover:text-white hover:border-accent-primary disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => loadMembers()}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Members'}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 my-5 text-center">
          <p>{error}</p>
          <button onClick={() => loadMembers(true)}>Retry</button>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMembersModal
          communityId={communityId}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={() => {
            setShowInviteModal(false)
            // Optionally refresh members list
          }}
        />
      )}

      {ConfirmationDialog}
    </div>
  )
}

// Invite Members Modal Component
function InviteMembersModal({ communityId, onClose, onInviteSent }) {
  const [inviteMethod, setInviteMethod] = useState('email') // email, link, username
  const [emails, setEmails] = useState('')
  const [usernames, setUsernames] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Generate invite link
    const link = `${window.location.origin}/communities/${communityId}/join?invite=${Date.now()}`
    setInviteLink(link)
  }, [communityId])

  const handleSendInvites = async () => {
    setLoading(true)
    
    try {
      let inviteData = {}
      
      if (inviteMethod === 'email') {
        const emailList = emails.split(',').map(email => email.trim()).filter(Boolean)
        if (emailList.length === 0) {
          alert('Please enter at least one email address')
          return
        }
        inviteData = { emails: emailList }
      } else if (inviteMethod === 'username') {
        const usernameList = usernames.split(',').map(username => username.trim()).filter(Boolean)
        if (usernameList.length === 0) {
          alert('Please enter at least one username')
          return
        }
        inviteData = { usernames: usernameList }
      }
      
      const result = await communityService.inviteMembers(communityId, inviteData)
      
      if (result.success) {
        onInviteSent()
      } else {
        alert(result.error || 'Failed to send invitations')
      }
    } catch (error) {
      console.error('Failed to send invites:', error)
      alert('Failed to send invitations')
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-5">
      <div className="bg-card rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border-primary">
          <h3>Invite Members</h3>
          <button className="bg-transparent border-none text-2xl text-text-secondary cursor-pointer w-8 h-8 flex items-center justify-center rounded transition-all hover:bg-hover hover:text-text-primary" onClick={onClose}>×</button>
        </div>

        <div className="flex-1 p-5 overflow-y-auto">
          <div className="flex gap-2 mb-5 bg-background-secondary rounded-lg p-1">
            <button
              className={`flex-1 bg-transparent border-none rounded-md px-3 py-2 text-text-secondary cursor-pointer text-sm font-medium transition-all hover:bg-hover hover:text-text-primary ${inviteMethod === 'link' ? 'bg-accent-primary text-white' : ''}`}
              onClick={() => setInviteMethod('link')}
            >
              Share Link
            </button>
            <button
              className={`flex-1 bg-transparent border-none rounded-md px-3 py-2 text-text-secondary cursor-pointer text-sm font-medium transition-all hover:bg-hover hover:text-text-primary ${inviteMethod === 'email' ? 'bg-accent-primary text-white' : ''}`}
              onClick={() => setInviteMethod('email')}
            >
              Email Invites
            </button>
            <button
              className={`flex-1 bg-transparent border-none rounded-md px-3 py-2 text-text-secondary cursor-pointer text-sm font-medium transition-all hover:bg-hover hover:text-text-primary ${inviteMethod === 'username' ? 'bg-accent-primary text-white' : ''}`}
              onClick={() => setInviteMethod('username')}
            >
              By Username
            </button>
          </div>

          {inviteMethod === 'link' && (
            <div className="invite-link-section">
              <p>Share this link to invite people to your community:</p>
              <div className="link-input-container">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-background-secondary border border-border-primary rounded-md px-3 py-2 text-text-primary text-sm font-mono"
                />
                <button 
                  className="flex items-center gap-1 bg-accent-primary text-white border-none rounded-md px-3 py-2 cursor-pointer text-[13px] font-medium transition-all whitespace-nowrap hover:bg-accent-dark"
                  onClick={copyInviteLink}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {inviteMethod === 'email' && (
            <div className="email-invite-section">
              <label htmlFor="emails">Email Addresses</label>
              <textarea
                id="emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="Enter email addresses separated by commas"
                rows={4}
              />
              <p className="help-text">
                Enter multiple email addresses separated by commas
              </p>
            </div>
          )}

          {inviteMethod === 'username' && (
            <div className="username-invite-section">
              <label htmlFor="usernames">Usernames</label>
              <textarea
                id="usernames"
                value={usernames}
                onChange={(e) => setUsernames(e.target.value)}
                placeholder="Enter usernames separated by commas"
                rows={4}
              />
              <p className="help-text">
                Enter multiple usernames separated by commas (without @)
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-border-primary">
          <button className="bg-transparent border border-border-primary rounded-md px-4 py-2 text-text-secondary cursor-pointer font-medium transition-all hover:bg-hover hover:text-text-primary" onClick={onClose}>
            Cancel
          </button>
          {inviteMethod !== 'link' && (
            <button 
              className="bg-accent-primary text-white border-none rounded-md px-4 py-2 cursor-pointer font-medium transition-all hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed" 
              onClick={handleSendInvites}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Invites'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
