import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Users,
  Crown,
  Shield,
  ShieldCheck,
  MoreVertical,
  UserPlus,
  UserX,
  Ban,
  Mail,
  MessageSquare,
  Loader,
  AlertCircle,
  CheckCircle,
  Filter,
  ChevronDown,
  Calendar,
  Activity,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import communityService from '../../services/communityService'
import { getErrorMessage } from '../../utils/errorUtils'

interface Member {
  id: string
  username: string
  displayName?: string
  avatar?: string
  role: 'owner' | 'moderator' | 'member'
  joinedAt: string
  postCount?: number
  commentCount?: number
  reputation?: number
  verified?: boolean
  lastActive?: string
}

const CommunityMembersDetailPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'owner' | 'moderator' | 'member'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'activity' | 'reputation'>('newest')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null)
  const [community, setCommunity] = useState<any>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const roleFilters = [
    { value: 'all', label: 'All Members', icon: Users },
    { value: 'owner', label: 'Owners', icon: Crown },
    { value: 'moderator', label: 'Moderators', icon: Shield },
    { value: 'member', label: 'Members', icon: Users }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'activity', label: 'Most Active' },
    { value: 'reputation', label: 'Top Reputation' }
  ]

  useEffect(() => {
    if (communityName) {
      loadCommunityAndMembers()
    }
  }, [communityName])

  const loadCommunityAndMembers = async () => {
    setLoading(true)
    try {
      // Load community details
      const communityResult = await communityService.getCommunityByName(communityName!)
      if (communityResult.success && communityResult.community) {
        setCommunity(communityResult.community)
      }

      // Load members
      const membersResult = await communityService.getCommunityMembers(communityName!)
      if (membersResult.success && membersResult.members) {
        setMembers(membersResult.members)
      } else {
        setMembers([])
      }
    } catch (err: any) {
      console.error('Error loading members:', err)
      setErrorMessage(getErrorMessage(err, 'Failed to load members'))
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteToModerator = async (memberId: string) => {
    if (!community || !community.isOwner) return

    setActionLoading(true)
    try {
      const result = await communityService.promoteMember(community.id, memberId, 'moderator')
      if (result.success) {
        setSuccessMessage('Member promoted to moderator')
        setTimeout(() => setSuccessMessage(''), 3000)
        loadCommunityAndMembers()
      } else {
        setErrorMessage(getErrorMessage(result.error, 'Failed to promote member'))
      }
    } catch (err: any) {
      console.error('Error promoting member:', err)
      setErrorMessage(getErrorMessage(err, 'Failed to promote member'))
    } finally {
      setActionLoading(false)
      setShowMemberMenu(null)
    }
  }

  const handleDemoteModerator = async (memberId: string) => {
    if (!community || !community.isOwner) return

    if (!confirm('Are you sure you want to demote this moderator?')) return

    setActionLoading(true)
    try {
      const result = await communityService.demoteMember(community.id, memberId)
      if (result.success) {
        setSuccessMessage('Moderator demoted to member')
        setTimeout(() => setSuccessMessage(''), 3000)
        loadCommunityAndMembers()
      } else {
        setErrorMessage(getErrorMessage(result.error, 'Failed to demote moderator'))
      }
    } catch (err: any) {
      console.error('Error demoting moderator:', err)
      setErrorMessage(getErrorMessage(err, 'Failed to demote moderator'))
    } finally {
      setActionLoading(false)
      setShowMemberMenu(null)
    }
  }

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!community || (!community.isOwner && !community.isModerator)) return

    if (!confirm(`Are you sure you want to kick ${memberName}? They can rejoin later.`)) return

    setActionLoading(true)
    try {
      const result = await communityService.kickMember(community.id, memberId)
      if (result.success) {
        setSuccessMessage(`${memberName} has been kicked from the community`)
        setTimeout(() => setSuccessMessage(''), 3000)
        loadCommunityAndMembers()
      } else {
        setErrorMessage(getErrorMessage(result.error, 'Failed to kick member'))
      }
    } catch (err: any) {
      console.error('Error kicking member:', err)
      setErrorMessage(getErrorMessage(err, 'Failed to kick member'))
    } finally {
      setActionLoading(false)
      setShowMemberMenu(null)
    }
  }

  const handleBanMember = async (memberId: string, memberName: string) => {
    if (!community || (!community.isOwner && !community.isModerator)) return

    if (!confirm(`Are you sure you want to ban ${memberName}? They will not be able to rejoin.`)) return

    setActionLoading(true)
    try {
      const result = await communityService.banMember(community.id, memberId)
      if (result.success) {
        setSuccessMessage(`${memberName} has been banned from the community`)
        setTimeout(() => setSuccessMessage(''), 3000)
        loadCommunityAndMembers()
      } else {
        setErrorMessage(getErrorMessage(result.error, 'Failed to ban member'))
      }
    } catch (err: any) {
      console.error('Error banning member:', err)
      setErrorMessage(getErrorMessage(err, 'Failed to ban member'))
    } finally {
      setActionLoading(false)
      setShowMemberMenu(null)
    }
  }

  const handleDirectMessage = (memberId: string) => {
    navigate(`/messages/new?user=${memberId}`)
  }

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter((member) => member.role === filterRole)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (member) =>
          member.username.toLowerCase().includes(term) ||
          member.displayName?.toLowerCase().includes(term)
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
        case 'oldest':
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
        case 'activity':
          return (b.postCount || 0) + (b.commentCount || 0) - ((a.postCount || 0) + (a.commentCount || 0))
        case 'reputation':
          return (b.reputation || 0) - (a.reputation || 0)
        default:
          return 0
      }
    })

    return sorted
  }, [members, filterRole, searchTerm, sortBy])

  const getRoleBadge = (role: Member['role']) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-lg font-semibold">
            <Crown size={12} />
            Owner
          </span>
        )
      case 'moderator':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded-lg font-semibold">
            <Shield size={12} />
            Mod
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return formatDate(dateString)
  }

  const canManageMembers = community?.isOwner || community?.isModerator

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)]">
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader className="w-12 h-12 text-[#58a6ff]  mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Loading members...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/community/${communityName}`)}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Community
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">Community Members</h1>
              <p className="text-[var(--text-secondary)]">
                {community?.displayName} • {members.length} members
              </p>
            </div>
            {canManageMembers && (
              <button
                onClick={() => navigate(`/community/${communityName}/settings`)}
                style={{color: "var(--text-primary)"}} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl  font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all"
              >
                <ShieldCheck size={18} />
                Manage Settings
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-xl mb-6 flex items-center gap-2">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-base placeholder-[var(--text-secondary)] outline-none focus:border-[#58a6ff]/50 focus:shadow-[0_0_0_3px_rgba(88,166,255,0.1)] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="relative min-w-full sm:min-w-[160px]">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="w-full px-4 pr-10 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-base appearance-none cursor-pointer outline-none focus:border-[#58a6ff]/50 transition-all"
              >
                {roleFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
              />
            </div>

            {/* Sort */}
            <div className="relative min-w-full sm:min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 pr-10 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-base appearance-none cursor-pointer outline-none focus:border-[#58a6ff]/50 transition-all"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Members List */}
        {filteredAndSortedMembers.length === 0 ? (
          <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-12 text-center shadow-sm">
            <Users size={56} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No members found</h3>
            <p className="text-[var(--text-secondary)]">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm hover:border-[#58a6ff]/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Link to={`/user/${member.username}`}>
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.username}
                        className="w-16 h-16 rounded-xl object-cover border border-[var(--border-subtle)]"
                      />
                    ) : (
                      <div style={{color: "var(--text-primary)"}} className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  text-xl font-bold shadow-lg">
                        {(member.displayName || member.username)[0].toUpperCase()}
                      </div>
                    )}
                  </Link>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/user/${member.username}`}
                          className="text-lg font-bold text-[var(--text-primary)] hover:text-[#58a6ff] transition-colors block truncate"
                        >
                          {member.displayName || member.username}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <span>@{member.username}</span>
                          {member.verified && (
                            <CheckCircle size={14} className="text-[#58a6ff]" />
                          )}
                          {getRoleBadge(member.role)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {user && user.username !== member.username && (
                          <>
                            <button
                              onClick={() => handleDirectMessage(member.id)}
                              className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#58a6ff]/50 transition-all"
                              title="Send message"
                            >
                              <Mail size={18} />
                            </button>

                            {canManageMembers && member.role !== 'owner' && (
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setShowMemberMenu(showMemberMenu === member.id ? null : member.id)
                                  }
                                  className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#58a6ff]/50 transition-all"
                                >
                                  <MoreVertical size={18} />
                                </button>

                                {showMemberMenu === member.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setShowMemberMenu(null)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-[var(--border-subtle)] rounded-xl shadow-lg z-20 overflow-hidden">
                                      {community.isOwner && (
                                        <>
                                          {member.role === 'moderator' ? (
                                            <button
                                              onClick={() => handleDemoteModerator(member.id)}
                                              className="w-full px-4 py-3 text-left text-[var(--text-primary)] hover:bg-gray-50 transition-all flex items-center gap-2"
                                            >
                                              <UserX size={16} />
                                              Demote
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handlePromoteToModerator(member.id)}
                                              className="w-full px-4 py-3 text-left text-[var(--text-primary)] hover:bg-gray-50 transition-all flex items-center gap-2"
                                            >
                                              <UserPlus size={16} />
                                              Promote to Mod
                                            </button>
                                          )}
                                        </>
                                      )}
                                      <button
                                        onClick={() =>
                                          handleKickMember(
                                            member.id,
                                            member.displayName || member.username
                                          )
                                        }
                                        className="w-full px-4 py-3 text-left text-orange-500 hover:bg-gray-50 transition-all flex items-center gap-2"
                                      >
                                        <UserX size={16} />
                                        Kick
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleBanMember(member.id, member.displayName || member.username)
                                        }
                                        className="w-full px-4 py-3 text-left text-red-500 hover:bg-gray-50 transition-all flex items-center gap-2"
                                      >
                                        <Ban size={16} />
                                        Ban
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                          <Calendar size={14} />
                          <span>Joined</span>
                        </div>
                        <div className="text-[var(--text-primary)] font-semibold">{formatDate(member.joinedAt)}</div>
                      </div>

                      {member.lastActive && (
                        <div className="text-sm">
                          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                            <Activity size={14} />
                            <span>Last Active</span>
                          </div>
                          <div className="text-[var(--text-primary)] font-semibold">{formatTimeAgo(member.lastActive)}</div>
                        </div>
                      )}

                      {member.postCount !== undefined && (
                        <div className="text-sm">
                          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                            <MessageSquare size={14} />
                            <span>Posts</span>
                          </div>
                          <div className="text-[var(--text-primary)] font-semibold">{member.postCount}</div>
                        </div>
                      )}

                      {member.reputation !== undefined && (
                        <div className="text-sm">
                          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                            <ShieldCheck size={14} />
                            <span>Reputation</span>
                          </div>
                          <div className="text-[var(--text-primary)] font-semibold">{member.reputation}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityMembersDetailPage
