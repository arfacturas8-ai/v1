import React, { useState, useEffect } from 'react'
import {
  Shield, Eye, EyeOff, Lock, Unlock, Users, UserX,
  Globe, Settings, AlertTriangle, Check, X, Info,
  Bell, BellOff, MessageSquare, Heart, UserCheck
} from 'lucide-react'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'

const SocialPrivacySettings = ({ onClose }) => {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [privacySettings, setPrivacySettings] = useState({
    // Profile Privacy
    profileVisibility: 'public', // public, friends, private
    showEmail: false,
    showPhoneNumber: false,
    showLocation: true,
    showBirthdate: false,
    showJoinDate: true,

    // Social Privacy
    showFollowers: true,
    showFollowing: true,
    showFriends: true,
    showMutualConnections: true,
    allowFollowing: true,
    requireFollowApproval: false,

    // Activity Privacy
    showActivity: true,
    showPosts: true,
    showComments: true,
    showReactions: true,
    showOnlineStatus: true,
    showLastSeen: false,

    // Interaction Privacy
    allowMessages: true,
    allowFriendRequests: true,
    allowTagging: true,
    allowMentions: true,
    restrictedWordsEnabled: false,
    restrictedWords: [],

    // Notification Privacy
    emailNotifications: true,
    pushNotifications: true,
    socialNotifications: {
      newFollower: true,
      friendRequest: true,
      friendAccepted: true,
      mentions: true,
      reactions: false,
      comments: true
    }
  })

  const [blockedUsers, setBlockedUsers] = useState([])
  const [restrictedUsers, setRestrictedUsers] = useState([])
  const [showBlockedUsers, setShowBlockedUsers] = useState(false)

  useEffect(() => {
    loadPrivacySettings()
    loadBlockedUsers()
  }, [])

  const loadPrivacySettings = async () => {
    try {
      setLoading(true)
      const response = await socialService.getNotificationSettings()

      if (response.settings) {
        setPrivacySettings(prev => ({
          ...prev,
          ...response.settings
        }))
      }

    } catch (error) {
      console.error('Error loading privacy settings:', error)
      showToast('Failed to load privacy settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadBlockedUsers = async () => {
    try {
      const response = await socialService.getBlockedUsers()
      setBlockedUsers(response.users || [])
    } catch (error) {
      console.error('Error loading blocked users:', error)
    }
  }

  const handleSettingChange = (section, setting, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object'
        ? { ...prev[section], [setting]: value }
        : value
    }))
  }

  const savePrivacySettings = async () => {
    try {
      setSaving(true)
      await socialService.updateNotificationSettings(privacySettings)
      showToast('Privacy settings saved successfully', 'success')
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      showToast('Failed to save privacy settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const unblockUser = async (userId) => {
    try {
      await socialService.unblockUser(userId)
      setBlockedUsers(prev => prev.filter(user => user.id !== userId))
      showToast('User unblocked successfully', 'success')
    } catch (error) {
      console.error('Error unblocking user:', error)
      showToast('Failed to unblock user', 'error')
    }
  }

  const addRestrictedWord = (word) => {
    if (word && !privacySettings.restrictedWords.includes(word.toLowerCase())) {
      setPrivacySettings(prev => ({
        ...prev,
        restrictedWords: [...prev.restrictedWords, word.toLowerCase()]
      }))
    }
  }

  const removeRestrictedWord = (word) => {
    setPrivacySettings(prev => ({
      ...prev,
      restrictedWords: prev.restrictedWords.filter(w => w !== word)
    }))
  }

  const PrivacyLevel = ({ level, children }) => {
    const getColor = () => {
      switch (level) {
        case 'high': return 'border-l-red-500'
        case 'medium': return 'border-l-yellow-400'
        case 'low': return 'border-l-green-400'
        default: return 'border-l-gray-600'
      }
    }

    return (
      <div className={`pl-4 mb-4 bg-white/[0.02] rounded-r-lg border-l-4 ${getColor()}`}>
        {children}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5 text-white/60">
        <div className="w-8 h-8 border-[3px] border-white/10 border-t-green-400 rounded-full  mb-4" />
        <p>Loading privacy settings...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[20px] flex items-center justify-center z-[1000] p-5">
      <div className="w-full max-w-[800px] max-h-[90vh] bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3 text-white">
            <Shield size={24} />
            <h2 className="m-0 text-xl font-semibold">Privacy & Safety</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 min-h-[44px] rounded-md bg-red-500/10 text-red-500 transition-all hover:bg-red-500/20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-white/[0.02]">
          <button
            className={`flex-1 min-h-[44px] px-5 py-4 border-none bg-transparent text-sm font-medium transition-all relative flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'text-green-400 bg-green-400/10 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-400'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <Eye size={16} />
            Profile
          </button>
          <button
            className={`flex-1 min-h-[44px] px-5 py-4 border-none bg-transparent text-sm font-medium transition-all relative flex items-center justify-center gap-2 ${
              activeTab === 'social'
                ? 'text-green-400 bg-green-400/10 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-400'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('social')}
          >
            <Users size={16} />
            Social
          </button>
          <button
            className={`flex-1 min-h-[44px] px-5 py-4 border-none bg-transparent text-sm font-medium transition-all relative flex items-center justify-center gap-2 ${
              activeTab === 'interactions'
                ? 'text-green-400 bg-green-400/10 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-400'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('interactions')}
          >
            <MessageSquare size={16} />
            Interactions
          </button>
          <button
            className={`flex-1 min-h-[44px] px-5 py-4 border-none bg-transparent text-sm font-medium transition-all relative flex items-center justify-center gap-2 ${
              activeTab === 'blocking'
                ? 'text-green-400 bg-green-400/10 after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-400'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('blocking')}
          >
            <UserX size={16} />
            Blocking
            {blockedUsers.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-lg min-w-4 text-center">
                {blockedUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Profile Privacy Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-[600px] mx-auto">
              <div className="mb-6 text-center">
                <h3 className="m-0 mb-2 text-lg font-semibold text-white">Profile Visibility</h3>
                <p className="m-0 text-sm text-white/60">Control who can see your profile information</p>
              </div>

              <PrivacyLevel level="high">
                <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-white mb-1">Profile Visibility</label>
                    <span className="text-xs text-white/60 leading-snug">
                      Who can see your profile
                    </span>
                  </div>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) => handleSettingChange('profileVisibility', null, e.target.value)}
                    className="min-h-[44px] px-3 py-2 border border-white/20 rounded-md bg-white/5 text-white text-sm cursor-pointer min-w-[120px] focus:outline-none focus:border-green-400"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </PrivacyLevel>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Show Email Address</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Display your email on your profile
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.showEmail
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('showEmail', null, !privacySettings.showEmail)}
                >
                  {privacySettings.showEmail ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Show Location</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Display your location on your profile
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.showLocation
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('showLocation', null, !privacySettings.showLocation)}
                >
                  {privacySettings.showLocation ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Show Join Date</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Display when you joined CRYB
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.showJoinDate
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('showJoinDate', null, !privacySettings.showJoinDate)}
                >
                  {privacySettings.showJoinDate ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Show Online Status</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Let others see when you're online
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.showOnlineStatus
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('showOnlineStatus', null, !privacySettings.showOnlineStatus)}
                >
                  {privacySettings.showOnlineStatus ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Social Privacy Tab */}
          {activeTab === 'social' && (
            <div className="max-w-[600px] mx-auto">
              <div className="mb-6 text-center">
                <h3 className="m-0 mb-2 text-lg font-semibold text-white">Social Connections</h3>
                <p className="m-0 text-sm text-white/60">Control your social interactions and connections</p>
              </div>

              <PrivacyLevel level="medium">
                <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-white mb-1">Allow Following</label>
                    <span className="text-xs text-white/60 leading-snug">
                      Let others follow you
                    </span>
                  </div>
                  <button
                    className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                      privacySettings.allowFollowing
                        ? 'border-green-400 bg-green-400/10 text-green-400'
                        : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                    }`}
                    onClick={() => handleSettingChange('allowFollowing', null, !privacySettings.allowFollowing)}
                  >
                    {privacySettings.allowFollowing ? <Unlock size={16} /> : <Lock size={16} />}
                  </button>
                </div>
              </PrivacyLevel>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Require Follow Approval</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Manually approve follow requests
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.requireFollowApproval
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('requireFollowApproval', null, !privacySettings.requireFollowApproval)}
                >
                  {privacySettings.requireFollowApproval ? <UserCheck size={16} /> : <Users size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Show Followers</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Display your followers list
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.showFollowers
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('showFollowers', null, !privacySettings.showFollowers)}
                >
                  {privacySettings.showFollowers ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Show Following</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Display who you're following
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.showFollowing
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('showFollowing', null, !privacySettings.showFollowing)}
                >
                  {privacySettings.showFollowing ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Show Friends</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Display your friends list
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.showFriends
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('showFriends', null, !privacySettings.showFriends)}
                >
                  {privacySettings.showFriends ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Interactions Tab */}
          {activeTab === 'interactions' && (
            <div className="max-w-[600px] mx-auto">
              <div className="mb-6 text-center">
                <h3 className="m-0 mb-2 text-lg font-semibold text-white">Interaction Settings</h3>
                <p className="m-0 text-sm text-white/60">Control how others can interact with you</p>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Allow Messages</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Let others send you direct messages
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.allowMessages
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('allowMessages', null, !privacySettings.allowMessages)}
                >
                  {privacySettings.allowMessages ? <MessageSquare size={16} /> : <X size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Allow Friend Requests</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Let others send you friend requests
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.allowFriendRequests
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('allowFriendRequests', null, !privacySettings.allowFriendRequests)}
                >
                  {privacySettings.allowFriendRequests ? <Heart size={16} /> : <X size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-white mb-1">Allow Mentions</label>
                  <span className="text-xs text-white/60 leading-snug">
                    Let others mention you in posts and comments
                  </span>
                </div>
                <button
                  className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                    privacySettings.allowMentions
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                  }`}
                  onClick={() => handleSettingChange('allowMentions', null, !privacySettings.allowMentions)}
                >
                  {privacySettings.allowMentions ? <Check size={16} /> : <X size={16} />}
                </button>
              </div>

              {/* Notification Settings */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h4 className="m-0 mb-4 text-base font-semibold text-white">Notification Preferences</h4>

                {Object.entries(privacySettings.socialNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-4 border-b border-white/10 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                    </div>
                    <button
                      className={`flex items-center justify-center w-10 h-10 min-h-[44px] rounded-lg border-2 transition-all ${
                        value
                          ? 'border-green-400 bg-green-400/10 text-green-400'
                          : 'border-white/20 bg-transparent text-white/50 hover:border-white/40 hover:text-white/70'
                      }`}
                      onClick={() => handleSettingChange('socialNotifications', key, !value)}
                    >
                      {value ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocking Tab */}
          {activeTab === 'blocking' && (
            <div className="max-w-[600px] mx-auto">
              <div className="mb-6 text-center">
                <h3 className="m-0 mb-2 text-lg font-semibold text-white">Blocked Users</h3>
                <p className="m-0 text-sm text-white/60">Manage users you've blocked</p>
              </div>

              {blockedUsers.length > 0 ? (
                <div className="mb-6">
                  {blockedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between px-4 py-4 mb-3 bg-white/[0.02] border border-white/10 rounded-xl transition-all hover:bg-white/5">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          {user.avatar ? (
                            typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
                              <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-lg" />
                            ) : (
                              <span className="w-10 h-10 rounded-lg flex items-center justify-center text-base">{user.avatar}</span>
                            )
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                              <UserX size={16} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="m-0 mb-1 text-sm font-semibold text-white">{user.displayName}</h4>
                          <span className="block text-xs text-white/60 mb-0.5">@{user.username}</span>
                          <span className="text-[11px] text-white/40">
                            Blocked {new Date(user.blockedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => unblockUser(user.id)}
                        className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 border border-green-400/30 rounded-md bg-green-400/10 text-green-400 text-xs font-medium transition-all hover:bg-green-400/20 hover:border-green-400"
                      >
                        <Unlock size={14} />
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-5 text-center text-white/60">
                  <UserX size={48} className="mb-4 opacity-50" />
                  <h3 className="m-0 mb-2 text-base text-white/80">No blocked users</h3>
                  <p className="m-0 text-sm">Users you block will appear here</p>
                </div>
              )}

              <div className="flex items-start gap-3 px-4 py-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg mt-6">
                <AlertTriangle size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="m-0 mb-1 text-sm font-semibold text-yellow-400">About Blocking</h4>
                  <p className="m-0 text-xs text-white/80 leading-snug">
                    Blocked users cannot see your profile, send you messages,
                    or interact with your content. You won't see their content either.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex sm:flex-row flex-col sm:items-center items-start justify-between gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Info size={16} />
            <span>Changes are saved automatically</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={savePrivacySettings}
              disabled={saving}
              className="min-h-[44px] px-5 py-2.5 border border-green-400 rounded-md bg-green-400/10 text-green-400 text-sm font-medium transition-all hover:bg-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SocialPrivacySettings
