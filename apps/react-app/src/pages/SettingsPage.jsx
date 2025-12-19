/**
 * SettingsPage.jsx
 * Modernized settings page with iOS aesthetic
 * Features: Explicit light theme colors, inline styles, iOS-style components
 */

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

    if (strength <= 2) return { level: 'weak', color: '#EF4444' }
    if (strength <= 4) return { level: 'medium', color: '#F59E0B' }
    return { level: 'strong', color: '#10B981' }
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAFA'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', flexShrink: 0 }}></div>
          <p style={{ fontSize: '18px', color: '#666666', marginTop: '16px' }}>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div role="main" aria-label="Settings page" style={{
      minHeight: '100vh',
      background: '#FAFAFA'
    }}>
      {/* Global Message */}
      {message && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '12px 16px',
          textAlign: 'center',
          fontWeight: 500,
          background: message.type === 'error'
            ? 'rgba(239, 68, 68, 0.9)'
            : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          color: 'white',
          backdropFilter: 'blur(8px)'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Left Sidebar Navigation */}
        <aside style={{
          width: '256px',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          background: '#FAFAFA',
          display: isMobile ? 'none' : 'block'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            padding: '32px 24px',
            color: '#000000',
            margin: 0
          }}>Settings</h1>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                    : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#666666',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 500,
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
                aria-label={`${tab.label} settings`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span style={{ fontSize: '20px' }} aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Bottom Navigation */}
        <aside style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          background: 'white',
          display: isMobile ? 'block' : 'none'
        }}>
          <nav style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '8px',
            padding: '12px',
            WebkitOverflowScrolling: 'touch'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                    : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#666666',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  flexShrink: 0,
                  minHeight: '44px',
                  minWidth: '72px'
                }}
                aria-label={`${tab.label} settings`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span style={{ fontSize: '18px' }} aria-hidden="true">{tab.icon}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          marginLeft: isMobile ? 0 : '256px',
          paddingBottom: isMobile ? '96px' : '32px'
        }}>
          <div style={{
            maxWidth: '896px',
            margin: '0 auto',
            padding: '32px 16px'
          }}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#000000'
                  }}>Profile Settings</h2>
                  <p style={{ color: '#666666', margin: 0 }}>Customize your public profile and personal information</p>
                </div>

                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Avatar Upload */}
                  <div style={{
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '16px',
                      color: '#666666'
                    }}>Profile Picture</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" loading="lazy" style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }} />
                        ) : (
                          <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
                            {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'inline-block',
                          padding: '10px 24px',
                          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                          borderRadius: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          color: 'white',
                          fontSize: '15px',
                          minHeight: '44px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                        >
                          Upload New
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            style={{ display: 'none' }}
                            aria-label="Upload profile picture"
                          />
                        </label>
                        <p style={{
                          fontSize: '14px',
                          marginTop: '8px',
                          color: '#666666'
                        }}>JPG, PNG or GIF. Max size 5MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Username (Read-only) */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Username</label>
                    <input
                      type="text"
                      value={currentUser?.username || ''}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#F5F5F5',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px',
                        cursor: 'not-allowed',
                        color: '#666666',
                        fontSize: '15px',
                        minHeight: '48px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <p style={{
                      fontSize: '14px',
                      marginTop: '4px',
                      color: '#666666'
                    }}>Your username cannot be changed</p>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Display Name</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      placeholder="Enter your display name"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px',
                        color: '#000000',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        minHeight: '48px',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                      aria-label="Display name"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={500}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px',
                        color: '#000000',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        resize: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                    />
                    <p style={{
                      fontSize: '14px',
                      marginTop: '4px',
                      color: '#666666'
                    }}>{profileData.bio.length}/500 characters</p>
                  </div>

                  {/* Location */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Location</label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      placeholder="City, Country"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px',
                        color: '#000000',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        minHeight: '48px',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Website</label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px',
                        color: '#000000',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        minHeight: '48px',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                    />
                  </div>

                  {/* Social Links */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Social Links</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input
                        type="text"
                        value={profileData.socialLinks.twitter}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          socialLinks: { ...profileData.socialLinks, twitter: e.target.value }
                        })}
                        placeholder="Twitter/X username"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'white',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderRadius: '12px',
                          color: '#000000',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          minHeight: '48px',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                      />
                      <input
                        type="text"
                        value={profileData.socialLinks.github}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          socialLinks: { ...profileData.socialLinks, github: e.target.value }
                        })}
                        placeholder="GitHub username"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'white',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderRadius: '12px',
                          color: '#000000',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          minHeight: '48px',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                      />
                      <input
                        type="text"
                        value={profileData.socialLinks.linkedin}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          socialLinks: { ...profileData.socialLinks, linkedin: e.target.value }
                        })}
                        placeholder="LinkedIn profile"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'white',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          borderRadius: '12px',
                          color: '#000000',
                          fontSize: '15px',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          minHeight: '48px',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                      />
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '12px',
                      color: '#666666'
                    }}>Interests</label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                      gap: '8px'
                    }}>
                      {availableInterests.map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestToggle(interest)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                            background: profileData.interests.includes(interest)
                              ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                              : 'white',
                            color: profileData.interests.includes(interest) ? 'white' : '#666666',
                            border: `1px solid ${profileData.interests.includes(interest) ? 'transparent' : 'rgba(0, 0, 0, 0.06)'}`,
                            cursor: 'pointer',
                            minHeight: '36px',
                            boxShadow: profileData.interests.includes(interest) ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!profileData.interests.includes(interest)) {
                              e.currentTarget.style.borderColor = '#6366F1'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!profileData.interests.includes(interest)) {
                              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                            }
                          }}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      borderRadius: '12px',
                      fontWeight: 500,
                      transition: 'opacity 0.2s',
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      color: 'white',
                      border: 'none',
                      fontSize: '15px',
                      minHeight: '48px'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.currentTarget.style.opacity = '1'
                    }}
                  >
                    Save Profile
                  </button>
                </form>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#000000'
                  }}>Account Settings</h2>
                  <p style={{ color: '#666666', margin: 0 }}>Manage your email, password, and account preferences</p>
                </div>

                {/* Email */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Email Address</h3>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Current Email</label>
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#F5F5F5',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px',
                        cursor: 'not-allowed',
                        color: '#666666',
                        fontSize: '15px',
                        minHeight: '48px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <p style={{
                      fontSize: '14px',
                      marginTop: '4px',
                      color: '#666666'
                    }}>Contact support to change your email address</p>
                  </div>
                </div>

                {/* Password Change */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Change Password</h3>
                  <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        marginBottom: '8px',
                        color: '#666666'
                      }}>Current Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="Enter current password"
                          style={{
                            width: '100%',
                            padding: '12px 48px 12px 16px',
                            background: 'white',
                            border: `1px solid ${passwordErrors.currentPassword ? '#EF4444' : 'rgba(0, 0, 0, 0.06)'}`,
                            borderRadius: '12px',
                            color: '#000000',
                            fontSize: '15px',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            minHeight: '48px',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            if (!passwordErrors.currentPassword) {
                              e.currentTarget.style.borderColor = '#6366F1'
                            }
                          }}
                          onBlur={(e) => {
                            if (!passwordErrors.currentPassword) {
                              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            transition: 'color 0.2s',
                            color: '#666666',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p style={{ color: '#EF4444', fontSize: '14px', marginTop: '4px' }}>{passwordErrors.currentPassword}</p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        marginBottom: '8px',
                        color: '#666666'
                      }}>New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          placeholder="Enter new password"
                          style={{
                            width: '100%',
                            padding: '12px 48px 12px 16px',
                            background: 'white',
                            border: `1px solid ${passwordErrors.newPassword ? '#EF4444' : 'rgba(0, 0, 0, 0.06)'}`,
                            borderRadius: '12px',
                            color: '#000000',
                            fontSize: '15px',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            minHeight: '48px',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            if (!passwordErrors.newPassword) {
                              e.currentTarget.style.borderColor = '#6366F1'
                            }
                          }}
                          onBlur={(e) => {
                            if (!passwordErrors.newPassword) {
                              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            transition: 'color 0.2s',
                            color: '#666666',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordData.newPassword && (
                        <div style={{
                          marginTop: '8px',
                          height: '8px',
                          background: '#F5F5F5',
                          borderRadius: '999px',
                          overflow: 'hidden'
                        }}>
                          <div
                            style={{
                              height: '100%',
                              transition: 'all 0.3s',
                              background: calculatePasswordStrength(passwordData.newPassword).color,
                              width: calculatePasswordStrength(passwordData.newPassword).level === 'weak' ? '33%' :
                                     calculatePasswordStrength(passwordData.newPassword).level === 'medium' ? '66%' : '100%'
                            }}
                          ></div>
                        </div>
                      )}
                      {passwordErrors.newPassword && (
                        <p style={{ color: '#EF4444', fontSize: '14px', marginTop: '4px' }}>{passwordErrors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        marginBottom: '8px',
                        color: '#666666'
                      }}>Confirm New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          placeholder="Re-enter new password"
                          style={{
                            width: '100%',
                            padding: '12px 48px 12px 16px',
                            background: 'white',
                            border: `1px solid ${passwordErrors.confirmPassword ? '#EF4444' : 'rgba(0, 0, 0, 0.06)'}`,
                            borderRadius: '12px',
                            color: '#000000',
                            fontSize: '15px',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            minHeight: '48px',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            if (!passwordErrors.confirmPassword) {
                              e.currentTarget.style.borderColor = '#6366F1'
                            }
                          }}
                          onBlur={(e) => {
                            if (!passwordErrors.confirmPassword) {
                              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)'
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            transition: 'color 0.2s',
                            color: '#666666',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p style={{ color: '#EF4444', fontSize: '14px', marginTop: '4px' }}>{passwordErrors.confirmPassword}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      style={{
                        width: '100%',
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        borderRadius: '12px',
                        fontWeight: 500,
                        transition: 'opacity 0.2s',
                        opacity: passwordLoading ? 0.5 : 1,
                        cursor: passwordLoading ? 'not-allowed' : 'pointer',
                        color: 'white',
                        border: 'none',
                        fontSize: '15px',
                        minHeight: '48px'
                      }}
                      onMouseEnter={(e) => {
                        if (!passwordLoading) e.currentTarget.style.opacity = '0.9'
                      }}
                      onMouseLeave={(e) => {
                        if (!passwordLoading) e.currentTarget.style.opacity = '1'
                      }}
                    >
                      Update Password
                    </button>
                  </form>
                </div>

                {/* Delete Account */}
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '16px',
                  padding: '24px'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: '#000000'
                  }}>Delete Account</h3>
                  <p style={{
                    marginBottom: '16px',
                    color: '#666666'
                  }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      background: '#EF4444',
                      borderRadius: '12px',
                      fontWeight: 500,
                      transition: 'background 0.2s',
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      color: 'white',
                      border: 'none',
                      fontSize: '15px',
                      minHeight: '48px'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.background = '#DC2626'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.currentTarget.style.background = '#EF4444'
                    }}
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#000000'
                  }}>Privacy Settings</h2>
                  <p style={{ color: '#666666', margin: 0 }}>Control your privacy and who can see your information</p>
                </div>

                <form onSubmit={handlePrivacySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Profile Visibility</label>
                    <select
                      value={privacySettings.profileVisibility}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px',
                        color: '#000000',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        minHeight: '48px',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private - Only me</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Who can send you friend requests?</label>
                    <select
                      value={privacySettings.friendRequestsFrom}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, friendRequestsFrom: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px',
                        color: '#000000',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        minHeight: '48px',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends_of_friends">Friends of Friends</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Who can message you?</label>
                    <select
                      value={privacySettings.messagePrivacy}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, messagePrivacy: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '12px',
                        color: '#000000',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        minHeight: '48px',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div style={{
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}>
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
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      borderRadius: '12px',
                      fontWeight: 500,
                      transition: 'opacity 0.2s',
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      color: 'white',
                      border: 'none',
                      fontSize: '15px',
                      minHeight: '48px'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.currentTarget.style.opacity = '1'
                    }}
                  >
                    Save Privacy Settings
                  </button>
                </form>

                {/* Blocked Users */}
                {blockedUsers.length > 0 && (
                  <div style={{
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      marginBottom: '16px',
                      color: '#000000'
                    }}>Blocked Users ({blockedUsers.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {blockedUsers.map(user => (
                        <div key={user._id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: '#FAFAFA',
                          borderRadius: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              color: '#000000',
                              width: '48px',
                              height: '48px',
                              flexShrink: 0,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600
                            }}>
                              {user.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: '#000000' }}>{user.username}</div>
                              <div style={{ fontSize: '14px', color: '#666666' }}>{user.displayName}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblockUser(user._id)}
                            style={{
                              padding: '8px 16px',
                              background: '#F5F5F5',
                              borderRadius: '12px',
                              fontSize: '14px',
                              fontWeight: 500,
                              transition: 'background 0.2s',
                              color: '#666666',
                              border: 'none',
                              cursor: 'pointer',
                              minHeight: '36px'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E5E5' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F5F5' }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#000000'
                  }}>Security</h2>
                  <p style={{ color: '#666666', margin: 0 }}>Manage your account security and authentication</p>
                </div>

                {/* Two-Factor Authentication */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Two-Factor Authentication</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{
                        fontWeight: 500,
                        marginBottom: '4px',
                        color: '#666666'
                      }}>
                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666666' }}>
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <button
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '12px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        background: twoFactorEnabled
                          ? '#EF4444'
                          : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '15px',
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => {
                        if (twoFactorEnabled) {
                          e.currentTarget.style.background = '#DC2626'
                        } else {
                          e.currentTarget.style.opacity = '0.9'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (twoFactorEnabled) {
                          e.currentTarget.style.background = '#EF4444'
                        } else {
                          e.currentTarget.style.opacity = '1'
                        }
                      }}
                    >
                      {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>

                {/* Passkey Settings */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Passkeys</h3>
                  <PasskeySettings />
                </div>

                {/* Active Sessions */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Active Sessions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeSessions.map(session => (
                      <div key={session.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        background: '#FAFAFA',
                        borderRadius: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: '4px', color: '#000000' }}>{session.device}</div>
                          <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#666666' }}>
                            {session.location} • {session.lastActive}
                            {session.current && (
                              <span style={{
                                padding: '2px 8px',
                                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                fontSize: '12px',
                                borderRadius: '999px',
                                color: 'white',
                                fontWeight: 500
                              }}>
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                        {!session.current && (
                          <button
                            style={{
                              padding: '8px 16px',
                              background: '#F5F5F5',
                              borderRadius: '12px',
                              fontSize: '14px',
                              fontWeight: 500,
                              transition: 'background 0.2s',
                              color: '#666666',
                              border: 'none',
                              cursor: 'pointer',
                              minHeight: '36px'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E5E5' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F5F5' }}
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
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Login History</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loginHistory.map(login => (
                      <div key={login.id} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '16px',
                        background: '#FAFAFA',
                        borderRadius: '12px'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#6366F1',
                          marginTop: '8px',
                          flexShrink: 0
                        }}></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: '4px', color: '#000000' }}>{login.device}</div>
                          <div style={{ fontSize: '14px', color: '#666666' }}>
                            {login.location} • {login.timestamp}
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: login.status === 'success'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                          color: login.status === 'success'
                            ? '#10B981'
                            : '#EF4444'
                        }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#000000'
                  }}>Notification Preferences</h2>
                  <p style={{ color: '#666666', margin: 0 }}>Choose what notifications you want to receive</p>
                </div>

                <form onSubmit={handleNotificationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}>
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
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      borderRadius: '12px',
                      fontWeight: 500,
                      transition: 'opacity 0.2s',
                      opacity: notificationLoading ? 0.5 : 1,
                      cursor: notificationLoading ? 'not-allowed' : 'pointer',
                      color: 'white',
                      border: 'none',
                      fontSize: '15px',
                      minHeight: '48px'
                    }}
                    onMouseEnter={(e) => {
                      if (!notificationLoading) e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      if (!notificationLoading) e.currentTarget.style.opacity = '1'
                    }}
                  >
                    Save Notification Settings
                  </button>
                </form>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#000000'
                  }}>Appearance</h2>
                  <p style={{ color: '#666666', margin: 0 }}>Customize how the app looks and feels</p>
                </div>

                <form onSubmit={handleAppearanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Theme Toggle */}
                  <div style={{
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      marginBottom: '16px',
                      color: '#000000'
                    }}>Theme</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <ThemeToggle />
                      <p style={{ color: '#666666', margin: 0 }}>
                        Current theme: <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#666666'
                    }}>Language</label>
                    <select style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '12px',
                      color: '#000000',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      minHeight: '48px',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>

                  {/* Accessibility Options */}
                  <div style={{
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}>
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
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      borderRadius: '12px',
                      fontWeight: 500,
                      transition: 'opacity 0.2s',
                      opacity: appearanceLoading ? 0.5 : 1,
                      cursor: appearanceLoading ? 'not-allowed' : 'pointer',
                      color: 'white',
                      border: 'none',
                      fontSize: '15px',
                      minHeight: '48px'
                    }}
                    onMouseEnter={(e) => {
                      if (!appearanceLoading) e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      if (!appearanceLoading) e.currentTarget.style.opacity = '1'
                    }}
                  >
                    Save Appearance Settings
                  </button>
                </form>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#000000'
                  }}>Integrations</h2>
                  <p style={{ color: '#666666', margin: 0 }}>Connect third-party apps and manage API access</p>
                </div>

                {/* OAuth Settings */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Connected Apps</h3>
                  <OAuthSettings />
                </div>

                {/* API Keys */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>API Keys</h3>
                  <APIKeysSettings />
                </div>
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#000000'
                  }}>Web3 Wallet</h2>
                  <p style={{ color: '#666666', margin: 0 }}>Connect and manage your cryptocurrency wallets</p>
                </div>

                {/* Wallet Connection */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Wallet Connection</h3>
                  <WalletConnectButton />
                </div>

                {/* Token Balances */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Token Balances</h3>
                  <TokenBalanceDisplay />
                </div>

                {/* Wallet Addresses */}
                <div style={{
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#000000'
                  }}>Saved Addresses</h3>
                  <p style={{
                    marginBottom: '16px',
                    color: '#666666'
                  }}>No saved wallet addresses yet</p>
                  <button
                    style={{
                      padding: '10px 24px',
                      background: '#F5F5F5',
                      borderRadius: '12px',
                      fontWeight: 500,
                      transition: 'background 0.2s',
                      color: '#666666',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '15px',
                      minHeight: '44px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E5E5' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F5F5' }}
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, marginBottom: '4px', color: '#666666' }}>{label}</div>
        <div style={{ fontSize: '14px', color: '#666666' }}>{description}</div>
      </div>
      <label style={{
        position: 'relative',
        display: 'inline-block',
        width: '48px',
        height: '24px',
        flexShrink: 0,
        cursor: 'pointer'
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0
          }}
        />
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '999px',
          transition: 'all 0.2s',
          background: checked
            ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
            : '#E5E5E5',
          border: checked ? 'none' : '2px solid rgba(0, 0, 0, 0.06)'
        }}></span>
        <span style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          width: '16px',
          height: '16px',
          background: 'white',
          borderRadius: '50%',
          transition: 'transform 0.2s',
          transform: checked ? 'translateX(24px)' : 'translateX(0)'
        }}></span>
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
