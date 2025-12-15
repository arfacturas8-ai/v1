import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '../components/ui'
import userService from '../services/userService'
import apiService from '../services/api'
import authService from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import WalletConnectButton from '../components/web3/WalletConnectButton'
import TokenBalanceDisplay from '../components/web3/TokenBalanceDisplay'
import APIKeysSettings from '../components/Settings/APIKeysSettings'
import PasskeySettings from '../components/Settings/PasskeySettings'
import OAuthSettings from '../components/Settings/OAuthSettings'
import ThemeToggle from '../components/ui/ThemeToggle.tsx'
import { useTheme } from '../contexts/ThemeContext.tsx'
import { useLoadingAnnouncement, useErrorAnnouncement } from '../utils/accessibility'
import { useResponsive } from '../hooks/useResponsive'

function SettingsPage() {
  const navigate = useNavigate()
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const compactSpacing = {
    formGap: isMobile ? 16 : isTablet ? 14 : 12,
    headerMargin: isMobile ? 20 : isTablet ? 18 : 16,
    logoMargin: isMobile ? 12 : isTablet ? 10 : 8,
    labelMargin: isMobile ? 8 : 6,
    inputPadding: isMobile ? 12 : 10,
    dividerMargin: isMobile ? 20 : isTablet ? 18 : 14,
    cardPadding: isMobile ? 20 : isTablet ? 24 : 20,
    sectionGap: isMobile ? 16 : isTablet ? 14 : 12
  }
  const { theme } = useTheme()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    interests: [],
    socialLinks: {
      twitter: '',
      github: '',
      linkedin: '',
      cryb: ''
    }
  })
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    friendRequestsFrom: 'everyone',
    messagePrivacy: 'friends',
    onlineStatus: true,
    showEmail: false,
    showLocation: false
  })
  const [blockedUsers, setBlockedUsers] = useState([])

  // Appearance Settings State
  const [appearanceSettings, setAppearanceSettings] = useState({
    reduceMotion: false,
    highContrast: false,
    compactMode: false
  })
  const [appearanceLoading, setAppearanceLoading] = useState(false)

  // Notification Preferences State
  const [notificationPreferences, setNotificationPreferences] = useState({
    friend_requests: true,
    friend_accepted: true,
    new_follower: true,
    messages: true,
    mentions: true,
    comments: true,
    likes: true,
    shares: true,
    system_updates: true,
    newsletter: false
  })
  const [notificationLoading, setNotificationLoading] = useState(false)

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordMessage, setPasswordMessage] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [activeSessions, setActiveSessions] = useState([])
  const [loginHistory, setLoginHistory] = useState([])

  const availableInterests = [
    'AI', 'Machine Learning', 'Programming', 'Gaming', 'Cyberpunk',
    'Science Fiction', 'Technology', 'Cybersecurity', 'Quantum Computing',
    'Neural Networks', 'Writing', 'Physics', 'Art', 'Music', 'Design',
    'Photography', 'Movies', 'Books', 'Travel', 'Fitness'
  ]

  useEffect(() => {
    loadUserData()
  }, [currentUser])

  const loadUserData = async () => {
    if (!currentUser) {
      setDataLoading(false)
      return
    }

    setDataLoading(true)

    try {
      // Fetch full user profile from API
      const response = await userService.getUserProfile()

      if (response.success && response.user) {
        const user = response.user

        setProfileData({
          displayName: user.displayName || '',
          bio: user.bio || '',
          location: user.location || '',
          website: user.website || '',
          interests: user.interests || [],
          socialLinks: user.socialLinks || {
            twitter: '',
            github: '',
            linkedin: '',
            cryb: ''
          }
        })

        setPrivacySettings(user.privacySettings || {
          profileVisibility: 'public',
          friendRequestsFrom: 'everyone',
          messagePrivacy: 'friends',
          onlineStatus: true,
          showEmail: false,
          showLocation: false
        })

        // Load appearance settings
        setAppearanceSettings(user.appearanceSettings || {
          reduceMotion: false,
          highContrast: false,
          compactMode: false
        })

        // Load notification preferences
        setNotificationPreferences(user.notificationPreferences || {
          friend_requests: true,
          friend_accepted: true,
          new_follower: true,
          messages: true,
          mentions: true,
          comments: true,
          likes: true,
          shares: true,
          system_updates: true,
          newsletter: false
        })

        // Load blocked users
        if (user.blockedUsers && user.blockedUsers.length > 0) {
          const blocked = await Promise.all(
            user.blockedUsers.map(async (userId) => {
              try {
                const res = await userService.getUserById(userId)
                return res.success ? res.user : null
              } catch (error) {
                console.error(`Failed to load blocked user ${userId}:`, error)
                return null
              }
            })
          )
          setBlockedUsers(blocked.filter(Boolean))
        } else {
          setBlockedUsers([])
        }

        // Load security data from API
        setTwoFactorEnabled(user.twoFactorEnabled || false)

        // Fetch active sessions
        try {
          const sessionsResponse = await apiService.get('/users/me/sessions')
          if (sessionsResponse.success && sessionsResponse.data) {
            setActiveSessions(sessionsResponse.data.sessions || [])
          } else {
            setActiveSessions([])
          }
        } catch (error) {
          console.error('Failed to load active sessions:', error)
          setActiveSessions([])
        }

        // Fetch login history
        try {
          const historyResponse = await apiService.get('/users/me/login-history')
          if (historyResponse.success && historyResponse.data) {
            setLoginHistory(historyResponse.data.history || [])
          } else {
            setLoginHistory([])
          }
        } catch (error) {
          console.error('Failed to load login history:', error)
          setLoginHistory([])
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await userService.updateProfile(profileData)
      if (response.success) {
        showMessage('Profile updated successfully!')
      } else {
        showMessage('Failed to update profile', 'error')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      showMessage('An error occurred while updating your profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePrivacySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await apiService.put('/users/me/privacy', { privacySettings })
      if (response.success) {
        showMessage('Privacy settings updated successfully!')
      } else {
        showMessage('Failed to update privacy settings', 'error')
      }
    } catch (error) {
      console.error('Privacy update error:', error)
      showMessage('An error occurred while updating privacy settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInterestToggle = (interest) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleUnblockUser = async (userId) => {
    try {
      const response = await apiService.delete(`/users/me/blocked/${userId}`)
      if (response.success) {
        showMessage('User unblocked successfully!')
        loadUserData() // Refresh blocked users list
      } else {
        showMessage('Failed to unblock user', 'error')
      }
    } catch (error) {
      console.error('Unblock user error:', error)
      showMessage('Failed to unblock user', 'error')
    }
  }

  const handleClearNotifications = async () => {
    try {
      const response = await apiService.delete('/notifications/all')
      if (response.success) {
        showMessage('All notifications cleared!')
      } else {
        showMessage('Failed to clear notifications', 'error')
      }
    } catch (error) {
      console.error('Clear notifications error:', error)
      showMessage('Failed to clear notifications', 'error')
    }
  }

  const handleExportData = async () => {
    if (!window.confirm('This will download all your data in JSON format. Continue?')) {
      return
    }

    setLoading(true)
    try {
      const response = await userService.exportUserData()
      if (response.success || response.data) {
        const data = response.data || response
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cryb-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showMessage('Your data has been downloaded successfully!')
      } else {
        showMessage('Failed to export data', 'error')
      }
    } catch (error) {
      console.error('Data export error:', error)
      showMessage('An error occurred while exporting your data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt('WARNING: This action cannot be undone!\n\nType "DELETE MY ACCOUNT" to confirm account deletion:')

    if (confirmation !== 'DELETE MY ACCOUNT') {
      showMessage('Account deletion cancelled', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await userService.deleteAccountGDPR({ confirmation: 'DELETE MY ACCOUNT' })
      if (response.success) {
        showMessage('Your account deletion request has been submitted. You will be logged out shortly.')
        // Use navigate or logout instead of window.location
        setTimeout(() => {
          authService.logout()
          navigate('/')
        }, 3000)
      } else {
        showMessage(response.error || 'Failed to delete account', 'error')
      }
    } catch (error) {
      console.error('Account deletion error:', error)
      showMessage(error.message || 'An error occurred while deleting your account', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Appearance Settings Handlers
  const handleAppearanceChange = (setting, value) => {
    setAppearanceSettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }

  const handleAppearanceSubmit = async (e) => {
    e.preventDefault()
    setAppearanceLoading(true)

    try {
      const response = await apiService.put('/users/me/appearance', { appearanceSettings })
      if (response.success) {
        // Apply settings to document for immediate effect
        document.documentElement.classList.toggle('reduce-motion', appearanceSettings.reduceMotion)
        document.documentElement.classList.toggle('high-contrast', appearanceSettings.highContrast)
        document.documentElement.classList.toggle('compact-mode', appearanceSettings.compactMode)

        showMessage('Appearance settings updated successfully!')
      } else {
        showMessage('Failed to update appearance settings', 'error')
      }
    } catch (error) {
      console.error('Appearance update error:', error)
      showMessage('An error occurred while updating appearance settings', 'error')
    } finally {
      setAppearanceLoading(false)
    }
  }

  // Notification Preferences Handlers
  const handleNotificationChange = (notificationType, value) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [notificationType]: value
    }))
  }

  const handleNotificationSubmit = async (e) => {
    e.preventDefault()
    setNotificationLoading(true)

    try {
      const response = await apiService.put('/users/me/notifications', { notificationPreferences })
      if (response.success) {
        showMessage('Notification preferences updated successfully!')
      } else {
        showMessage('Failed to update notification preferences', 'error')
      }
    } catch (error) {
      console.error('Notification update error:', error)
      showMessage('An error occurred while updating notification preferences', 'error')
    } finally {
      setNotificationLoading(false)
    }
  }

  // Password Change Handlers
  const validatePassword = (password) => {
    const errors = []
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    return errors
  }

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 2) return { level: 'weak', color: 'bg-red-500' }
    if (strength <= 4) return { level: 'medium', color: 'bg-yellow-500' }
    return { level: 'strong', color: 'bg-green-500' }
  }

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear specific field error when user types
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }

    // Clear password message when user types
    if (passwordMessage) {
      setPasswordMessage('')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordErrors({})
    setPasswordMessage('')

    // Validate form
    const errors = {}

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required'
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required'
    } else {
      const validationErrors = validatePassword(passwordData.newPassword)
      if (validationErrors.length > 0) {
        errors.newPassword = validationErrors[0]
      }
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password'
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setPasswordLoading(true)

    try {
      const response = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      )

      if (response.success) {
        setPasswordMessage(response.message || 'Password changed successfully!')
        // Clear form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        showMessage('Password changed successfully!')
      } else {
        setPasswordErrors({ currentPassword: response.error || 'Failed to change password' })
        showMessage(response.error || 'Failed to change password', 'error')
      }
    } catch (error) {
      console.error('Password change error:', error)
      setPasswordErrors({ currentPassword: 'An error occurred while changing your password' })
      showMessage('An error occurred while changing your password', 'error')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Accessibility: Announce loading and error states to screen readers
  useLoadingAnnouncement(dataLoading, 'Loading settings')
  useErrorAnnouncement(message?.type === 'error' ? message.text : null)

  // Apply appearance settings on mount and when they change
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', appearanceSettings.reduceMotion)
    document.documentElement.classList.toggle('high-contrast', appearanceSettings.highContrast)
    document.documentElement.classList.toggle('compact-mode', appearanceSettings.compactMode)
  }, [appearanceSettings])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'account', label: 'Account', icon: '📧' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'wallet', label: 'Wallet', icon: '👛' }
  ]

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div role="main" aria-label="Settings page" className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Global Message */}
      {message && (
        <div className={`safe-area-top fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center font-medium ${
          message.type === 'error'
            ? 'bg-red-500/90 text-white backdrop-blur-sm'
            : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Left Sidebar Navigation */}
        <aside className="safe-area-top w-64 border-r border-[var(--border-subtle)] fixed left-0 top-0 bottom-0 overflow-y-auto lg:block hidden" style={{ background: 'var(--bg-primary)' }}>
          <h1 className="text-2xl font-bold px-6 py-8" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <nav className="flex flex-col gap-1 px-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`touch-target flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white shadow-lg'
                    : 'hover:bg-gray-100'
                }`}
                style={activeTab !== tab.id ? { color: 'var(--text-secondary)' } : {}}
                aria-label={`${tab.label} settings`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="text-xl" aria-hidden="true">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Bottom Navigation */}
        <aside className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)] lg:hidden" style={{ background: 'var(--bg-primary)' }}>
          <nav className="flex overflow-x-auto gap-2 px-3 py-3 hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`touch-target flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                    : ''
                }`}
                style={activeTab !== tab.id ? { color: 'var(--text-secondary)' } : {}}
                aria-label={`${tab.label} settings`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="text-lg" aria-hidden="true">{tab.icon}</span>
                <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 pb-24 lg:pb-8">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Profile Settings</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Customize your public profile and personal information</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                    <label className="block text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Profile Picture</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div style={{color: "var(--text-primary)"}} className=" text-3xl font-bold">
                            {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label style={{color: "var(--text-primary)"}} className="touch-target inline-block px-6 py-2.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl font-medium cursor-pointer hover:opacity-90 transition-opacity">
                          Upload New
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            aria-label="Upload profile picture"
                          />
                        </label>
                        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>JPG, PNG or GIF. Max size 5MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Username (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Username</label>
                    <input
                      type="text"
                      value={currentUser?.username || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-50 border border-[var(--border-subtle)] rounded-xl cursor-not-allowed"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your username cannot be changed</p>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      placeholder="Enter your display name"
                      className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl placeholder-[var(--text-secondary)] focus:border-[#58a6ff] focus:outline-none transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      aria-label="Display name"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl placeholder-[var(--text-secondary)] focus:border-[#58a6ff] focus:outline-none transition-colors resize-none"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{profileData.bio.length}/500 characters</p>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Location</label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      placeholder="City, Country"
                      className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl placeholder-[var(--text-secondary)] focus:border-[#58a6ff] focus:outline-none transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Website</label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl placeholder-[var(--text-secondary)] focus:border-[#58a6ff] focus:outline-none transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Social Links</label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={profileData.socialLinks.twitter}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          socialLinks: { ...profileData.socialLinks, twitter: e.target.value }
                        })}
                        placeholder="Twitter/X username"
                        className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl placeholder-[var(--text-secondary)] focus:border-[#58a6ff] focus:outline-none transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      />
                      <input
                        type="text"
                        value={profileData.socialLinks.github}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          socialLinks: { ...profileData.socialLinks, github: e.target.value }
                        })}
                        placeholder="GitHub username"
                        className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl placeholder-[var(--text-secondary)] focus:border-[#58a6ff] focus:outline-none transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      />
                      <input
                        type="text"
                        value={profileData.socialLinks.linkedin}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          socialLinks: { ...profileData.socialLinks, linkedin: e.target.value }
                        })}
                        placeholder="LinkedIn profile"
                        className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl placeholder-[var(--text-secondary)] focus:border-[#58a6ff] focus:outline-none transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Interests</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {availableInterests.map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestToggle(interest)}
                          className={`touch-target px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            profileData.interests.includes(interest)
                              ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 border border-[var(--border-subtle)] hover:border-[#58a6ff]'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{color: "var(--text-primary)"}} className="touch-target w-full px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    Save Profile
                  </button>
                </form>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Account Settings</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Manage your email, password, and account preferences</p>
                </div>

                {/* Email */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Email Address</h3>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Current Email</label>
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-50 border border-[var(--border-subtle)] rounded-xl cursor-not-allowed"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Contact support to change your email address</p>
                  </div>
                </div>

                {/* Password Change */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="Enter current password"
                          className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl placeholder-[var(--text-secondary)] focus:outline-none transition-colors ${
                            passwordErrors.currentPassword ? 'border-red-500' : 'border-[var(--border-subtle)] focus:border-[#58a6ff]'
                          }`}
                          style={{ color: 'var(--text-primary)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          placeholder="Enter new password"
                          className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl placeholder-[var(--text-secondary)] focus:outline-none transition-colors ${
                            passwordErrors.newPassword ? 'border-red-500' : 'border-[var(--border-subtle)] focus:border-[#58a6ff]'
                          }`}
                          style={{ color: 'var(--text-primary)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordData.newPassword && (
                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${calculatePasswordStrength(passwordData.newPassword).color}`}
                            style={{
                              width: calculatePasswordStrength(passwordData.newPassword).level === 'weak' ? '33%' :
                                     calculatePasswordStrength(passwordData.newPassword).level === 'medium' ? '66%' : '100%'
                            }}
                          ></div>
                        </div>
                      )}
                      {passwordErrors.newPassword && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          placeholder="Re-enter new password"
                          className={`w-full px-4 py-3 pr-12 bg-white border rounded-xl placeholder-[var(--text-secondary)] focus:outline-none transition-colors ${
                            passwordErrors.confirmPassword ? 'border-red-500' : 'border-[var(--border-subtle)] focus:border-[#58a6ff]'
                          }`}
                          style={{ color: 'var(--text-primary)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      style={{color: "var(--text-primary)"}} className="touch-target w-full px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Update Password
                    </button>
                  </form>
                </div>

                {/* Delete Account */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Delete Account</h3>
                  <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    style={{color: "var(--text-primary)"}} className="touch-target px-6 py-3 bg-red-500  rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Privacy Settings</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Control your privacy and who can see your information</p>
                </div>

                <form onSubmit={handlePrivacySubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Profile Visibility</label>
                    <select
                      value={privacySettings.profileVisibility}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl focus:border-[#58a6ff] focus:outline-none transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private - Only me</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Who can send you friend requests?</label>
                    <select
                      value={privacySettings.friendRequestsFrom}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, friendRequestsFrom: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl focus:border-[#58a6ff] focus:outline-none transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends_of_friends">Friends of Friends</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Who can message you?</label>
                    <select
                      value={privacySettings.messagePrivacy}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, messagePrivacy: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl focus:border-[#58a6ff] focus:outline-none transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
                    <ToggleSwitch
                      label="Show Online Status"
                      description="Let others see when you're online"
                      checked={privacySettings.onlineStatus}
                      onChange={(checked) => setPrivacySettings({ ...privacySettings, onlineStatus: checked })}
                    />

                    <ToggleSwitch
                      label="Show Email Address"
                      description="Display your email on your profile"
                      checked={privacySettings.showEmail}
                      onChange={(checked) => setPrivacySettings({ ...privacySettings, showEmail: checked })}
                    />

                    <ToggleSwitch
                      label="Show Location"
                      description="Display your location on your profile"
                      checked={privacySettings.showLocation}
                      onChange={(checked) => setPrivacySettings({ ...privacySettings, showLocation: checked })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{color: "var(--text-primary)"}} className="touch-target w-full px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    Save Privacy Settings
                  </button>
                </form>

                {/* Blocked Users */}
                {blockedUsers.length > 0 && (
                  <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Blocked Users ({blockedUsers.length})</h3>
                    <div className="space-y-3">
                      {blockedUsers.map(user => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div style={{color: "var(--text-primary)"}} className="w-10 h-10 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center  font-bold">
                              {user.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.username}</div>
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.displayName}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblockUser(user._id)}
                            className="touch-target px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Security</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Manage your account security and authentication</p>
                </div>

                {/* Two-Factor Authentication */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <button
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`touch-target px-6 py-2.5 rounded-xl font-medium transition-all ${
                        twoFactorEnabled
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:opacity-90'
                      }`}
                    >
                      {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>

                {/* Passkey Settings */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Passkeys</h3>
                  <PasskeySettings />
                </div>

                {/* Active Sessions */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Active Sessions</h3>
                  <div className="space-y-3">
                    {activeSessions.map(session => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{session.device}</div>
                          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            {session.location} • {session.lastActive}
                            {session.current && (
                              <span style={{color: "var(--text-primary)"}} className="px-2 py-0.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                        {!session.current && (
                          <button
                            className="touch-target px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            aria-label={`Revoke session ${session.device}`}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Login History */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Login History</h3>
                  <div className="space-y-3">
                    {loginHistory.map(login => (
                      <div key={login.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-[#58a6ff] mt-2"></div>
                        <div className="flex-1">
                          <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{login.device}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {login.location} • {login.timestamp}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          login.status === 'success'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {login.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Choose what notifications you want to receive</p>
                </div>

                <form onSubmit={handleNotificationSubmit} className="space-y-6">
                  <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
                    <ToggleSwitch
                      label="Friend Requests"
                      description="When someone sends you a friend request"
                      checked={notificationPreferences.friend_requests}
                      onChange={(checked) => handleNotificationChange('friend_requests', checked)}
                    />

                    <ToggleSwitch
                      label="Friend Accepted"
                      description="When someone accepts your friend request"
                      checked={notificationPreferences.friend_accepted}
                      onChange={(checked) => handleNotificationChange('friend_accepted', checked)}
                    />

                    <ToggleSwitch
                      label="New Follower"
                      description="When someone follows you"
                      checked={notificationPreferences.new_follower}
                      onChange={(checked) => handleNotificationChange('new_follower', checked)}
                    />

                    <ToggleSwitch
                      label="Messages"
                      description="When you receive a new message"
                      checked={notificationPreferences.messages}
                      onChange={(checked) => handleNotificationChange('messages', checked)}
                    />

                    <ToggleSwitch
                      label="Mentions"
                      description="When someone mentions you"
                      checked={notificationPreferences.mentions}
                      onChange={(checked) => handleNotificationChange('mentions', checked)}
                    />

                    <ToggleSwitch
                      label="Comments"
                      description="When someone comments on your posts"
                      checked={notificationPreferences.comments}
                      onChange={(checked) => handleNotificationChange('comments', checked)}
                    />

                    <ToggleSwitch
                      label="Likes"
                      description="When someone likes your content"
                      checked={notificationPreferences.likes}
                      onChange={(checked) => handleNotificationChange('likes', checked)}
                    />

                    <ToggleSwitch
                      label="Shares"
                      description="When someone shares your content"
                      checked={notificationPreferences.shares}
                      onChange={(checked) => handleNotificationChange('shares', checked)}
                    />

                    <ToggleSwitch
                      label="System Updates"
                      description="Important updates about the platform"
                      checked={notificationPreferences.system_updates}
                      onChange={(checked) => handleNotificationChange('system_updates', checked)}
                    />

                    <ToggleSwitch
                      label="Newsletter"
                      description="Receive our weekly newsletter"
                      checked={notificationPreferences.newsletter}
                      onChange={(checked) => handleNotificationChange('newsletter', checked)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={notificationLoading}
                    style={{color: "var(--text-primary)"}} className="touch-target w-full px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    Save Notification Settings
                  </button>
                </form>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Customize how the app looks and feels</p>
                </div>

                <form onSubmit={handleAppearanceSubmit} className="space-y-6">
                  {/* Theme Toggle */}
                  <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Theme</h3>
                    <div className="flex items-center justify-between">
                      <ThemeToggle />
                      <p style={{ color: 'var(--text-secondary)' }}>
                        Current theme: <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Language</label>
                    <select className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-xl focus:border-[#58a6ff] focus:outline-none transition-colors" style={{ color: 'var(--text-primary)' }}>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>

                  {/* Accessibility Options */}
                  <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
                    <ToggleSwitch
                      label="Reduce Motion"
                      description="Minimize animations and transitions"
                      checked={appearanceSettings.reduceMotion}
                      onChange={(checked) => handleAppearanceChange('reduceMotion', checked)}
                    />

                    <ToggleSwitch
                      label="High Contrast"
                      description="Increase contrast for better visibility"
                      checked={appearanceSettings.highContrast}
                      onChange={(checked) => handleAppearanceChange('highContrast', checked)}
                    />

                    <ToggleSwitch
                      label="Compact Mode"
                      description="Reduce spacing for more content"
                      checked={appearanceSettings.compactMode}
                      onChange={(checked) => handleAppearanceChange('compactMode', checked)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={appearanceLoading}
                    style={{color: "var(--text-primary)"}} className="touch-target w-full px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    Save Appearance Settings
                  </button>
                </form>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Integrations</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Connect third-party apps and manage API access</p>
                </div>

                {/* OAuth Settings */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Connected Apps</h3>
                  <OAuthSettings />
                </div>

                {/* API Keys */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>API Keys</h3>
                  <APIKeysSettings />
                </div>
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Web3 Wallet</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Connect and manage your cryptocurrency wallets</p>
                </div>

                {/* Wallet Connection */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Wallet Connection</h3>
                  <WalletConnectButton />
                </div>

                {/* Token Balances */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Token Balances</h3>
                  <TokenBalanceDisplay />
                </div>

                {/* Wallet Addresses */}
                <div className="bg-white  border border-[var(--border-subtle)] rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Saved Addresses</h3>
                  <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>No saved wallet addresses yet</p>
                  <button
                    className="touch-target px-6 py-2.5 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label="Add wallet address"
                  >
                    Add Address
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// Toggle Switch Component
const ToggleSwitch = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <div className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</div>
      </div>
      <label className="relative inline-block w-12 h-6 flex-shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span className={`absolute inset-0 rounded-full transition-all ${
          checked
            ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7]'
            : 'bg-gray-200 border-2 border-[var(--border-subtle)]'
        }`}></span>
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}></span>
      </label>
    </div>
  )
}

ToggleSwitch.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired
}

SettingsPage.propTypes = {}

export default SettingsPage
