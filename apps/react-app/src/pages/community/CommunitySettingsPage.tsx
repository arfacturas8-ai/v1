import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Trash2,
  Shield,
  Users,
  Settings,
  Palette,
  Eye,
  AlertTriangle,
  Loader,
  X,
  CheckCircle,
  AlertCircle,
  Search,
  Ban,
  UserX,
  Crown,
  ShieldCheck,
  Upload,
  Globe,
  Lock
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import communityService from '../../services/communityService'
import fileUploadService from '../../services/fileUploadService'
import { getErrorMessage } from '../../utils/errorUtils'

interface Community {
  id: string
  name: string
  displayName: string
  description: string
  icon?: string
  banner?: string
  category: string
  privacy: 'public' | 'private' | 'restricted'
  nsfw: boolean
  isOwner?: boolean
  isModerator?: boolean
  rules?: string[]
  settings?: {
    allowPosts?: boolean
    requireApproval?: boolean
    allowImages?: boolean
    allowVideos?: boolean
    allowPolls?: boolean
  }
}

interface Member {
  id: string
  username: string
  displayName?: string
  role: 'owner' | 'moderator' | 'member'
  avatar?: string
  joinedAt: string
}

const CommunitySettingsPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTab, setSelectedTab] = useState('general')
  const [formData, setFormData] = useState<Partial<Community>>({})
  const [members, setMembers] = useState<Member[]>([])
  const [bannedUsers, setBannedUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const iconInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'moderators', label: 'Moderators', icon: Shield },
    { id: 'banned', label: 'Banned Users', icon: Ban },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ]

  useEffect(() => {
    loadCommunity()
  }, [communityName])

  useEffect(() => {
    if (selectedTab === 'members' || selectedTab === 'moderators') {
      loadMembers()
    } else if (selectedTab === 'banned') {
      loadBannedUsers()
    }
  }, [selectedTab])

  const loadCommunity = async () => {
    setLoading(true)
    try {
      const result = await communityService.getCommunityByName(communityName!)

      if (result.success && result.community) {
        const comm = result.community
        setCommunity(comm)
        setFormData({
          displayName: comm.displayName,
          description: comm.description,
          category: comm.category,
          privacy: comm.privacy,
          nsfw: comm.nsfw,
          rules: comm.rules || [],
          settings: comm.settings || {}
        })

        if (!comm.isOwner && !comm.isModerator) {
          navigate(`/community/${communityName}`)
        }
      } else {
        setErrorMessage('Community not found')
      }
    } catch (err: any) {
      console.error('Error loading community:', err)
      setErrorMessage(err.message || 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    if (!community) return

    try {
      const result = await communityService.getCommunityMembers(community.id)
      if (result.success && result.members) {
        setMembers(result.members)
      }
    } catch (err) {
      console.error('Error loading members:', err)
    }
  }

  const loadBannedUsers = async () => {
    if (!community) return

    try {
      const result = await communityService.getBannedUsers(community.id)
      if (result.success && result.users) {
        setBannedUsers(result.users)
      }
    } catch (err) {
      console.error('Error loading banned users:', err)
    }
  }

  const handleSave = async () => {
    if (!community) return

    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const result = await communityService.updateCommunity(community.id, formData)

      if (result.success) {
        setSuccessMessage('Settings saved successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
        loadCommunity()
      } else {
        setErrorMessage(getErrorMessage(result.error, 'Failed to save settings'))
      }
    } catch (err: any) {
      console.error('Error saving settings:', err)
      setErrorMessage(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (field: 'icon' | 'banner', file: File | null) => {
    if (!file) return

    const validation = fileUploadService.validateFile(file, 'image')
    if (validation.length > 0) {
      setErrorMessage(validation[0])
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (field === 'icon') {
        setIconPreview(e.target?.result as string)
      } else if (field === 'banner') {
        setBannerPreview(e.target?.result as string)
      }
    }
    reader.readAsDataURL(file)

    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  const handlePromoteToModerator = async (memberId: string) => {
    if (!community || !community.isOwner) return

    try {
      const result = await communityService.promoteMember(community.id, memberId, 'moderator')
      if (result.success) {
        setSuccessMessage('Member promoted to moderator')
        loadMembers()
      }
    } catch (err) {
      console.error('Error promoting member:', err)
      setErrorMessage('Failed to promote member')
    }
  }

  const handleDemoteModerator = async (memberId: string) => {
    if (!community || !community.isOwner) return

    try {
      const result = await communityService.demoteMember(community.id, memberId)
      if (result.success) {
        setSuccessMessage('Moderator demoted to member')
        loadMembers()
      }
    } catch (err) {
      console.error('Error demoting moderator:', err)
      setErrorMessage('Failed to demote moderator')
    }
  }

  const handleKickMember = async (memberId: string) => {
    if (!community) return

    if (!confirm('Are you sure you want to kick this member?')) return

    try {
      const result = await communityService.kickMember(community.id, memberId)
      if (result.success) {
        setSuccessMessage('Member kicked successfully')
        loadMembers()
      }
    } catch (err) {
      console.error('Error kicking member:', err)
      setErrorMessage('Failed to kick member')
    }
  }

  const handleBanMember = async (memberId: string) => {
    if (!community) return

    if (!confirm('Are you sure you want to ban this member?')) return

    try {
      const result = await communityService.banMember(community.id, memberId)
      if (result.success) {
        setSuccessMessage('Member banned successfully')
        loadMembers()
      }
    } catch (err) {
      console.error('Error banning member:', err)
      setErrorMessage('Failed to ban member')
    }
  }

  const handleUnbanUser = async (userId: string) => {
    if (!community) return

    try {
      const result = await communityService.unbanUser(community.id, userId)
      if (result.success) {
        setSuccessMessage('User unbanned successfully')
        loadBannedUsers()
      }
    } catch (err) {
      console.error('Error unbanning user:', err)
      setErrorMessage('Failed to unban user')
    }
  }

  const handleDeleteCommunity = async () => {
    if (!community || !community.isOwner) return

    try {
      const result = await communityService.deleteCommunity(community.id)
      if (result.success) {
        navigate('/communities')
      } else {
        setErrorMessage(getErrorMessage(result.error, 'Failed to delete community'))
      }
    } catch (err: any) {
      console.error('Error deleting community:', err)
      setErrorMessage(err.message || 'Failed to delete community')
    }
  }

  const filteredMembers = members.filter(
    (member) =>
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#58a6ff]  mx-auto mb-4" />
          <p className="text-[#666666]">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center max-w-md">
          <AlertCircle size={56} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-[#666666] mb-6">{errorMessage || 'Community not found'}</p>
          <button
            onClick={() => navigate('/communities')}
            className="px-8 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all"
          >
            Back to Communities
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#A0A0A0]">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/community/${communityName}`)}
            className="flex items-center gap-2 text-[#666666] hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Community
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Community Settings
              </h1>
              <p className="text-[#666666]">{community.displayName}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-xl mb-6 flex items-center gap-2">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] sticky top-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = selectedTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                          : 'text-[#666666] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              {/* General Settings */}
              {selectedTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">General Settings</h2>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-white">Display Name</label>
                    <input
                      type="text"
                      value={formData.displayName || ''}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#0D0D0D] border border-white/10 text-white outline-none focus:border-[#58a6ff]/50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-white">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full p-3 rounded-xl bg-[#0D0D0D] border border-white/10 text-white outline-none focus:border-[#58a6ff]/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-white">Category</label>
                    <select
                      value={formData.category || 'general'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#0D0D0D] border border-white/10 text-white outline-none"
                    >
                      {['general', 'gaming', 'technology', 'art', 'music', 'sports', 'education', 'business'].map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-white">Community Rules</label>
                    <div className="space-y-3">
                      {(formData.rules || []).map((rule, index) => (
                        <div key={index} className="flex gap-3">
                          <span className="text-[#666666] font-semibold pt-3">{index + 1}.</span>
                          <input
                            type="text"
                            value={rule}
                            onChange={(e) => {
                              const newRules = [...(formData.rules || [])]
                              newRules[index] = e.target.value
                              setFormData({ ...formData, rules: newRules })
                            }}
                            className="flex-1 p-3 rounded-xl bg-[#0D0D0D] border border-white/10 text-white outline-none"
                          />
                          <button
                            onClick={() => {
                              const newRules = (formData.rules || []).filter((_, i) => i !== index)
                              setFormData({ ...formData, rules: newRules })
                            }}
                            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setFormData({ ...formData, rules: [...(formData.rules || []), ''] })
                        }}
                        className="w-full p-3 border-2 border-dashed border-white/20 rounded-xl text-[#666666] hover:text-white hover:border-white/40 transition-all"
                      >
                        + Add Rule
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-white">Post Settings</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 bg-[#0D0D0D] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.settings?.allowPosts !== false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              settings: { ...formData.settings, allowPosts: e.target.checked }
                            })
                          }
                          className="w-5 h-5 accent-[#58a6ff]"
                        />
                        <span className="text-white">Allow members to create posts</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 bg-[#0D0D0D] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.settings?.requireApproval || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              settings: { ...formData.settings, requireApproval: e.target.checked }
                            })
                          }
                          className="w-5 h-5 accent-[#58a6ff]"
                        />
                        <span className="text-white">Require approval for new posts</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {selectedTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Appearance Settings</h2>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-white">Community Icon</label>
                    <div className="flex items-center gap-4">
                      {(iconPreview || community.icon) && (
                        <img
                          src={iconPreview || community.icon}
                          alt="Icon"
                          className="w-24 h-24 rounded-xl object-cover border border-white/10"
                        />
                      )}
                      <div>
                        <input
                          ref={iconInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange('icon', e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <button
                          onClick={() => iconInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-[#58a6ff] rounded-xl text-white font-semibold hover:bg-[#4a94e8] transition-all"
                        >
                          <Upload size={18} />
                          Upload Icon
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-white">Community Banner</label>
                    <div className="space-y-4">
                      {(bannerPreview || community.banner) && (
                        <img
                          src={bannerPreview || community.banner}
                          alt="Banner"
                          className="w-full h-48 rounded-xl object-cover border border-white/10"
                        />
                      )}
                      <div>
                        <input
                          ref={bannerInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange('banner', e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <button
                          onClick={() => bannerInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-[#58a6ff] rounded-xl text-white font-semibold hover:bg-[#4a94e8] transition-all"
                        >
                          <Upload size={18} />
                          Upload Banner
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {selectedTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Privacy Settings</h2>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2 text-white">Privacy Level</label>
                    <div className="space-y-3">
                      {[
                        { value: 'public', icon: Globe, title: 'Public', description: 'Anyone can view and join' },
                        {
                          value: 'restricted',
                          icon: Eye,
                          title: 'Restricted',
                          description: 'Anyone can view, approval required to join'
                        },
                        {
                          value: 'private',
                          icon: Lock,
                          title: 'Private',
                          description: 'Only approved members can view and join'
                        }
                      ].map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.value}
                            onClick={() => setFormData({ ...formData, privacy: option.value as any })}
                            className={`w-full p-4 rounded-xl text-left transition-all ${
                              formData.privacy === option.value
                                ? 'bg-[#58a6ff]/20 border-2 border-[#58a6ff]'
                                : 'bg-[#0D0D0D] border border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon
                                size={24}
                                className={formData.privacy === option.value ? 'text-[#58a6ff]' : 'text-[#666666]'}
                              />
                              <div>
                                <div className="font-semibold text-white">{option.title}</div>
                                <div className="text-sm text-[#666666]">{option.description}</div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-4 bg-[#0D0D0D] border border-white/10 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.nsfw || false}
                        onChange={(e) => setFormData({ ...formData, nsfw: e.target.checked })}
                        className="w-5 h-5 accent-[#58a6ff]"
                      />
                      <div>
                        <span className="font-semibold text-white block">NSFW (18+)</span>
                        <span className="text-sm text-[#666666]">Mark as adult content</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Members */}
              {selectedTab === 'members' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Members</h2>
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search members..."
                        className="pl-10 pr-4 py-2 bg-[#0D0D0D] border border-white/10 rounded-xl text-white text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-[#0D0D0D] border border-white/10 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full flex items-center justify-center text-white font-bold">
                            {member.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{member.displayName || member.username}</div>
                            <div className="text-sm text-[#666666]">@{member.username}</div>
                          </div>
                          {member.role === 'owner' && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-lg font-semibold flex items-center gap-1">
                              <Crown size={12} />
                              Owner
                            </span>
                          )}
                          {member.role === 'moderator' && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded-lg font-semibold flex items-center gap-1">
                              <ShieldCheck size={12} />
                              Mod
                            </span>
                          )}
                        </div>
                        {member.role !== 'owner' && community.isOwner && (
                          <div className="flex items-center gap-2">
                            {member.role === 'moderator' ? (
                              <button
                                onClick={() => handleDemoteModerator(member.id)}
                                className="px-3 py-2 bg-yellow-500/20 text-yellow-500 rounded-lg text-sm hover:bg-yellow-500/30 transition-all"
                              >
                                Demote
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePromoteToModerator(member.id)}
                                className="px-3 py-2 bg-green-500/20 text-green-500 rounded-lg text-sm hover:bg-green-500/30 transition-all"
                              >
                                Promote
                              </button>
                            )}
                            <button
                              onClick={() => handleKickMember(member.id)}
                              className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                            >
                              <UserX size={18} />
                            </button>
                            <button
                              onClick={() => handleBanMember(member.id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Ban size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderators */}
              {selectedTab === 'moderators' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Moderators</h2>
                  </div>

                  <div className="space-y-2">
                    {members
                      .filter((m) => m.role === 'moderator' || m.role === 'owner')
                      .map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-[#0D0D0D] border border-white/10 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full flex items-center justify-center text-white font-bold">
                              {member.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-semibold">
                                {member.displayName || member.username}
                              </div>
                              <div className="text-sm text-[#666666]">@{member.username}</div>
                            </div>
                            {member.role === 'owner' && (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-lg font-semibold flex items-center gap-1">
                                <Crown size={12} />
                                Owner
                              </span>
                            )}
                          </div>
                          {member.role === 'moderator' && community.isOwner && (
                            <button
                              onClick={() => handleDemoteModerator(member.id)}
                              className="px-3 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm hover:bg-red-500/30 transition-all"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Banned Users */}
              {selectedTab === 'banned' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Banned Users</h2>
                  </div>

                  {bannedUsers.length === 0 ? (
                    <div className="text-center py-12 text-[#666666]">No banned users</div>
                  ) : (
                    <div className="space-y-2">
                      {bannedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-[#0D0D0D] border border-white/10 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full flex items-center justify-center text-white font-bold">
                              {user.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{user.username}</div>
                              <div className="text-sm text-[#666666]">
                                Banned {new Date(user.bannedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="px-3 py-2 bg-green-500/20 text-green-500 rounded-lg text-sm hover:bg-green-500/30 transition-all"
                          >
                            Unban
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Danger Zone */}
              {selectedTab === 'danger' && community.isOwner && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Danger Zone</h2>
                  </div>

                  <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-2">Delete Community</h3>
                    <p className="text-[#666666] mb-4">
                      This action cannot be undone. All posts, comments, and member data will be permanently
                      deleted.
                    </p>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-red-500 rounded-xl text-white font-semibold hover:bg-red-600 transition-all"
                    >
                      <Trash2 size={18} />
                      Delete Community
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={32} className="text-red-500" />
              <h3 className="text-2xl font-bold text-white">Delete Community?</h3>
            </div>
            <p className="text-[#666666] mb-6">
              Are you absolutely sure? This will permanently delete <strong>{community.displayName}</strong> and
              all of its content. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-[#0D0D0D] border border-white/10 rounded-xl text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCommunity}
                className="flex-1 px-6 py-3 bg-red-500 rounded-xl text-white font-semibold hover:bg-red-600 transition-all"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommunitySettingsPage
