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
import { Input, Textarea, Select } from '../../components/ui/InputV1'

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
      setErrorMessage(getErrorMessage(err, 'Failed to load community'))
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
      setErrorMessage(getErrorMessage(err, 'Failed to save settings'))
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
      setErrorMessage(getErrorMessage(err, 'Failed to delete community'))
    }
  }

  const filteredMembers = members.filter(
    (member) =>
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', maxWidth: '448px' }}>
          <AlertCircle size={56} style={{ margin: '0 auto var(--space-4)', color: 'var(--color-error)' }} />
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{errorMessage || 'Community not found'}</p>
          <button
            onClick={() => navigate('/communities')}
            className="btn-primary"
            style={{ padding: 'var(--space-3) var(--space-8)' }}
          >
            Back to Communities
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--space-4) var(--space-4)', '@media (min-width: 640px)': { padding: 'var(--space-8)' } }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <button
            onClick={() => navigate(`/community/${communityName}`)}
            className="btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-2) var(--space-3)',
            }}
          >
            <ArrowLeft size={20} />
            Back to Community
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                Community Settings
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>{community.displayName}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div style={{
            background: 'var(--color-success-light)',
            border: '1px solid var(--color-success)',
            color: 'var(--color-success-dark)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            background: 'var(--color-error-light)',
            border: '1px solid var(--color-error)',
            color: 'var(--color-error-dark)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)', '@media (min-width: 1024px)': { gridTemplateColumns: '1fr 3fr' } }}>
          {/* Sidebar */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 'var(--space-4)' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = selectedTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={isActive ? 'gradient-primary' : 'btn-ghost'}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3) var(--space-4)',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ fontWeight: 'var(--font-medium)' }}>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              {/* General Settings */}
              {selectedTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>General Settings</h2>
                  </div>

                  <Input
                    label="Display Name"
                    type="text"
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  />

                  <Textarea
                    label="Description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    resize="none"
                  />

                  <Select
                    label="Category"
                    value={formData.category || 'general'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    options={['general', 'gaming', 'technology', 'art', 'music', 'sports', 'education', 'business'].map(
                      (cat) => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) })
                    )}
                  />

                  <div>
                    <label style={{ display: 'block', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Community Rules</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {(formData.rules || []).map((rule, index) => (
                        <div key={index} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-semibold)', paddingTop: 'var(--space-3)' }}>{index + 1}.</span>
                          <Input
                            type="text"
                            value={rule}
                            onChange={(e) => {
                              const newRules = [...(formData.rules || [])]
                              newRules[index] = e.target.value
                              setFormData({ ...formData, rules: newRules })
                            }}
                          />
                          <button
                            onClick={() => {
                              const newRules = (formData.rules || []).filter((_, i) => i !== index)
                              setFormData({ ...formData, rules: newRules })
                            }}
                            style={{
                              padding: 'var(--space-3)',
                              color: 'var(--color-error)',
                              background: 'none',
                              border: 'none',
                              borderRadius: 'var(--radius-xl)',
                              cursor: 'pointer',
                              transition: 'all var(--transition-normal)',
                            }}
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setFormData({ ...formData, rules: [...(formData.rules || []), ''] })
                        }}
                        style={{
                          width: '100%',
                          padding: 'var(--space-3)',
                          border: '2px dashed var(--border-default)',
                          borderRadius: 'var(--radius-xl)',
                          color: 'var(--text-secondary)',
                          background: 'none',
                          cursor: 'pointer',
                          transition: 'all var(--transition-normal)',
                        }}
                      >
                        + Add Rule
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Post Settings</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <label className="card-compact" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.settings?.allowPosts !== false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              settings: { ...formData.settings, allowPosts: e.target.checked }
                            })
                          }
                          style={{ width: '20px', height: '20px', accentColor: 'var(--brand-primary)' }}
                        />
                        <span style={{ color: 'var(--text-primary)' }}>Allow members to create posts</span>
                      </label>
                      <label className="card-compact" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.settings?.requireApproval || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              settings: { ...formData.settings, requireApproval: e.target.checked }
                            })
                          }
                          style={{ width: '20px', height: '20px', accentColor: 'var(--brand-primary)' }}
                        />
                        <span style={{ color: 'var(--text-primary)' }}>Require approval for new posts</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {selectedTab === 'appearance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Appearance Settings</h2>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Community Icon</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      {(iconPreview || community.icon) && (
                        <img
                          src={iconPreview || community.icon}
                          alt="Icon"
                          style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: 'var(--radius-xl)',
                            objectFit: 'cover',
                            border: '1px solid var(--border-subtle)'
                          }}
                        />
                      )}
                      <div>
                        <input
                          ref={iconInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange('icon', e.target.files?.[0] || null)}
                          style={{ display: 'none' }}
                        />
                        <button
                          onClick={() => iconInputRef.current?.click()}
                          className="btn-primary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                          }}
                        >
                          <Upload size={18} />
                          Upload Icon
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Community Banner</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      {(bannerPreview || community.banner) && (
                        <img
                          src={bannerPreview || community.banner}
                          alt="Banner"
                          style={{
                            width: '100%',
                            height: '192px',
                            borderRadius: 'var(--radius-xl)',
                            objectFit: 'cover',
                            border: '1px solid var(--border-subtle)'
                          }}
                        />
                      )}
                      <div>
                        <input
                          ref={bannerInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange('banner', e.target.files?.[0] || null)}
                          style={{ display: 'none' }}
                        />
                        <button
                          onClick={() => bannerInputRef.current?.click()}
                          className="btn-primary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                          }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Privacy Settings</h2>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Privacy Level</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
                        const isSelected = formData.privacy === option.value
                        return (
                          <button
                            key={option.value}
                            onClick={() => setFormData({ ...formData, privacy: option.value as any })}
                            style={{
                              width: '100%',
                              padding: 'var(--space-4)',
                              borderRadius: 'var(--radius-xl)',
                              textAlign: 'left',
                              transition: 'all var(--transition-normal)',
                              background: isSelected ? 'var(--color-info-light)' : 'var(--bg-secondary)',
                              border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                              <Icon
                                size={24}
                                style={{ color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)' }}
                              />
                              <div>
                                <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{option.title}</div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{option.description}</div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="card-compact" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.nsfw || false}
                        onChange={(e) => setFormData({ ...formData, nsfw: e.target.checked })}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--brand-primary)' }}
                      />
                      <div>
                        <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', display: 'block' }}>NSFW (18+)</span>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Mark as adult content</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Members */}
              {selectedTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>Members</h2>
                    <div style={{ width: '250px' }}>
                      <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search members..."
                        leftIcon={<Search size={18} />}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="card-compact"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div className="avatar avatar-md gradient-primary" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
                            {member.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-semibold)' }}>{member.displayName || member.username}</div>
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>@{member.username}</div>
                          </div>
                          {member.role === 'owner' && (
                            <span className="badge" style={{ background: 'rgba(255, 193, 7, 0.2)', color: '#FFC107', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                              <Crown size={12} />
                              Owner
                            </span>
                          )}
                          {member.role === 'moderator' && (
                            <span className="badge" style={{ background: 'var(--color-info-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                              <ShieldCheck size={12} />
                              Mod
                            </span>
                          )}
                        </div>
                        {member.role !== 'owner' && community.isOwner && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            {member.role === 'moderator' ? (
                              <button
                                onClick={() => handleDemoteModerator(member.id)}
                                className="btn-sm"
                                style={{
                                  background: 'rgba(255, 193, 7, 0.2)',
                                  color: '#FFC107',
                                  border: 'none'
                                }}
                              >
                                Demote
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePromoteToModerator(member.id)}
                                className="btn-sm"
                                style={{
                                  background: 'var(--color-success-light)',
                                  color: 'var(--color-success)',
                                  border: 'none'
                                }}
                              >
                                Promote
                              </button>
                            )}
                            <button
                              onClick={() => handleKickMember(member.id)}
                              style={{
                                padding: 'var(--space-2)',
                                color: 'var(--color-warning)',
                                background: 'none',
                                border: 'none',
                                borderRadius: 'var(--radius-lg)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-normal)',
                              }}
                            >
                              <UserX size={18} />
                            </button>
                            <button
                              onClick={() => handleBanMember(member.id)}
                              style={{
                                padding: 'var(--space-2)',
                                color: 'var(--color-error)',
                                background: 'none',
                                border: 'none',
                                borderRadius: 'var(--radius-lg)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-normal)',
                              }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Moderators</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {members
                      .filter((m) => m.role === 'moderator' || m.role === 'owner')
                      .map((member) => (
                        <div
                          key={member.id}
                          className="card-compact"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div className="avatar avatar-md gradient-primary" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
                              {member.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-semibold)' }}>
                                {member.displayName || member.username}
                              </div>
                              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>@{member.username}</div>
                            </div>
                            {member.role === 'owner' && (
                              <span className="badge" style={{ background: 'rgba(255, 193, 7, 0.2)', color: '#FFC107', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                <Crown size={12} />
                                Owner
                              </span>
                            )}
                          </div>
                          {member.role === 'moderator' && community.isOwner && (
                            <button
                              onClick={() => handleDemoteModerator(member.id)}
                              className="btn-sm"
                              style={{
                                background: 'var(--color-error-light)',
                                color: 'var(--color-error)',
                                border: 'none'
                              }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Banned Users</h2>
                  </div>

                  {bannedUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-secondary)' }}>No banned users</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {bannedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="card-compact"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div className="avatar avatar-md gradient-primary" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
                              {user.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-semibold)' }}>{user.username}</div>
                              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Banned {new Date(user.bannedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="btn-sm"
                            style={{
                              background: 'var(--color-success-light)',
                              color: 'var(--color-success)',
                              border: 'none'
                            }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Danger Zone</h2>
                  </div>

                  <div style={{
                    padding: 'var(--space-6)',
                    background: 'var(--color-error-light)',
                    border: '2px solid var(--color-error)',
                    borderRadius: 'var(--radius-xl)'
                  }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Delete Community</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                      This action cannot be undone. All posts, comments, and member data will be permanently
                      deleted.
                    </p>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-3) var(--space-6)',
                        background: 'var(--color-error)',
                        border: 'none',
                        borderRadius: 'var(--radius-full)',
                        color: 'var(--text-inverse)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-semibold)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-normal)',
                      }}
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
        <>
          <div
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
              zIndex: 'var(--z-modal-backdrop)',
            }}
          />
          <div
            className="card"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: 'var(--space-8)',
              maxWidth: '448px',
              width: '100%',
              zIndex: 'var(--z-modal)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <AlertTriangle size={32} style={{ color: 'var(--color-error)' }} />
              <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>Delete Community?</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              Are you absolutely sure? This will permanently delete <strong>{community.displayName}</strong> and
              all of its content. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCommunity}
                style={{
                  flex: 1,
                  padding: 'var(--space-3) var(--space-6)',
                  background: 'var(--color-error)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-inverse)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-normal)',
                }}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CommunitySettingsPage
