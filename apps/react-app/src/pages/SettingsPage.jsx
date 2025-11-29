import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
              } catch {
                return null
              }
            })
          )
          setBlockedUsers(blocked.filter(Boolean))
        } else {
          setBlockedUsers([])
        }

        // Mock security data (replace with real API calls)
        setTwoFactorEnabled(user.twoFactorEnabled || false)
        setActiveSessions([
          { id: 1, device: 'Chrome on Windows', location: 'New York, US', lastActive: '2 minutes ago', current: true },
          { id: 2, device: 'Safari on iPhone', location: 'New York, US', lastActive: '1 hour ago', current: false }
        ])
        setLoginHistory([
          { id: 1, timestamp: '2025-11-08 14:30', location: 'New York, US', device: 'Chrome on Windows', status: 'success' },
          { id: 2, timestamp: '2025-11-07 09:15', location: 'New York, US', device: 'Safari on iPhone', status: 'success' },
          { id: 3, timestamp: '2025-11-06 18:45', location: 'Los Angeles, US', device: 'Firefox on Mac', status: 'success' }
        ])
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
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      } else {
        showMessage('Failed to delete account', 'error')
      }
    } catch (error) {
      console.error('Account deletion error:', error)
      showMessage('An error occurred while deleting your account', 'error')
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

    if (strength <= 2) return { level: 'weak', color: '#ef4444' }
    if (strength <= 4) return { level: 'medium', color: '#f59e0b' }
    return { level: 'strong', color: '#10b981' }
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
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div role="main" aria-label="Settings page" style={styles.container}>
      {/* Global Message */}
      {message && (
        <div className="safe-area-top" style={{
          ...styles.message,
          ...(message.type === 'error' ? styles.messageError : styles.messageSuccess)
        }}>
          {message.text}
        </div>
      )}

      <div style={styles.wrapper}>
        {/* Left Sidebar Navigation */}
        <aside className="safe-area-top" style={styles.sidebar}>
          <h1 style={styles.sidebarTitle}>Settings</h1>
          <nav style={styles.sidebarNav}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="touch-target"
                style={{
                  ...styles.sidebarButton,
                  ...(activeTab === tab.id ? styles.sidebarButtonActive : {})
                }}
              >
                <span style={styles.sidebarIcon}>{tab.icon}</span>
                <span style={styles.sidebarLabel}>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={styles.content}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Profile Settings</h2>
              <p style={styles.sectionDescription}>Customize your public profile and personal information</p>

              <form onSubmit={handleProfileSubmit} style={styles.form}>
                {/* Avatar Upload */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Profile Picture</label>
                  <div style={styles.avatarContainer}>
                    <div style={styles.avatarPreview}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" loading="lazy" style={styles.avatarImage} />
                      ) : (
                        <div style={styles.avatarPlaceholder}>
                          {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div style={styles.avatarActions}>
                      <label className="touch-target" style={styles.uploadButton}>
                        Upload New
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          style={styles.fileInput}
                        />
                      </label>
                      <p style={styles.uploadHint}>JPG, PNG or GIF. Max size 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* Username (Read-only) */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Username</label>
                  <input
                    type="text"
                    value={currentUser?.username || ''}
                    disabled
                    style={{ ...styles.input, ...styles.inputDisabled }}
                  />
                  <p style={styles.inputHint}>Your username cannot be changed</p>
                </div>

                {/* Display Name */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Display Name</label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    placeholder="Enter your display name"
                    style={styles.input}
                  />
                </div>

                {/* Bio */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                    style={styles.textarea}
                  />
                  <p style={styles.inputHint}>{profileData.bio.length}/500 characters</p>
                </div>

                {/* Location */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location</label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="City, Country"
                    style={styles.input}
                  />
                </div>

                {/* Website */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Website</label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    style={styles.input}
                  />
                </div>

                {/* Social Links */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Social Links</label>
                  <div style={styles.socialLinks}>
                    <input
                      type="text"
                      value={profileData.socialLinks.twitter}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        socialLinks: { ...profileData.socialLinks, twitter: e.target.value }
                      })}
                      placeholder="Twitter/X username"
                      style={styles.input}
                    />
                    <input
                      type="text"
                      value={profileData.socialLinks.github}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        socialLinks: { ...profileData.socialLinks, github: e.target.value }
                      })}
                      placeholder="GitHub username"
                      style={styles.input}
                    />
                    <input
                      type="text"
                      value={profileData.socialLinks.linkedin}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        socialLinks: { ...profileData.socialLinks, linkedin: e.target.value }
                      })}
                      placeholder="LinkedIn profile"
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* Interests */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Interests</label>
                  <div style={styles.interestsGrid}>
                    {availableInterests.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className="touch-target"
                        style={{
                          ...styles.interestTag,
                          ...(profileData.interests.includes(interest) ? styles.interestTagActive : {})
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
                  className="touch-target"
                  style={{
                    ...styles.submitButton,
                    ...(loading ? styles.submitButtonDisabled : {})
                  }}
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Account Settings</h2>
              <p style={styles.sectionDescription}>Manage your email, password, and account preferences</p>

              {/* Email */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Email Address</h3>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Current Email</label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    style={{ ...styles.input, ...styles.inputDisabled }}
                  />
                  <p style={styles.inputHint}>Contact support to change your email address</p>
                </div>
              </div>

              {/* Password Change */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Change Password</h3>
                <form onSubmit={handlePasswordSubmit} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                      style={{
                        ...styles.input,
                        ...(passwordErrors.currentPassword ? styles.inputError : {})
                      }}
                    />
                    {passwordErrors.currentPassword && (
                      <p style={styles.errorText}>{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                      style={{
                        ...styles.input,
                        ...(passwordErrors.newPassword ? styles.inputError : {})
                      }}
                    />
                    {passwordData.newPassword && (
                      <div style={styles.passwordStrength}>
                        <div style={{
                          ...styles.passwordStrengthBar,
                          background: calculatePasswordStrength(passwordData.newPassword).color,
                          width: calculatePasswordStrength(passwordData.newPassword).level === 'weak' ? '33%' :
                                 calculatePasswordStrength(passwordData.newPassword).level === 'medium' ? '66%' : '100%'
                        }}></div>
                      </div>
                    )}
                    {passwordErrors.newPassword && (
                      <p style={styles.errorText}>{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Re-enter new password"
                      style={{
                        ...styles.input,
                        ...(passwordErrors.confirmPassword ? styles.inputError : {})
                      }}
                    />
                    {passwordErrors.confirmPassword && (
                      <p style={styles.errorText}>{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="touch-target"
                    style={{
                      ...styles.submitButton,
                      ...(passwordLoading ? styles.submitButtonDisabled : {})
                    }}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Delete Account */}
              <div style={styles.dangerCard}>
                <h3 style={styles.cardTitle}>Delete Account</h3>
                <p style={styles.dangerText}>
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="touch-target"
                  style={styles.dangerButton}
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Privacy Settings</h2>
              <p style={styles.sectionDescription}>Control your privacy and who can see your information</p>

              <form onSubmit={handlePrivacySubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Profile Visibility</label>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                    style={styles.select}
                  >
                    <option value="public">Public - Anyone can view</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private - Only me</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Who can send you friend requests?</label>
                  <select
                    value={privacySettings.friendRequestsFrom}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, friendRequestsFrom: e.target.value })}
                    style={styles.select}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends_of_friends">Friends of Friends</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Who can message you?</label>
                  <select
                    value={privacySettings.messagePrivacy}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, messagePrivacy: e.target.value })}
                    style={styles.select}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends">Friends Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div style={styles.toggleGroup}>
                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Show Online Status</div>
                      <div style={styles.toggleDescription}>Let others see when you're online</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={privacySettings.onlineStatus}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, onlineStatus: e.target.checked })}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Show Email Address</div>
                      <div style={styles.toggleDescription}>Display your email on your profile</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={privacySettings.showEmail}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showEmail: e.target.checked })}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Show Location</div>
                      <div style={styles.toggleDescription}>Display your location on your profile</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={privacySettings.showLocation}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showLocation: e.target.checked })}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="touch-target"
                  style={{
                    ...styles.submitButton,
                    ...(loading ? styles.submitButtonDisabled : {})
                  }}
                >
                  {loading ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </form>

              {/* Blocked Users */}
              {blockedUsers.length > 0 && (
                <div style={{ ...styles.card, marginTop: '24px' }}>
                  <h3 style={styles.cardTitle}>Blocked Users ({blockedUsers.length})</h3>
                  <div style={styles.blockedList}>
                    {blockedUsers.map(user => (
                      <div key={user._id} style={styles.blockedUser}>
                        <div style={styles.blockedUserInfo}>
                          <div style={styles.blockedUserAvatar}>
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={styles.blockedUsername}>{user.username}</div>
                            <div style={styles.blockedDisplayName}>{user.displayName}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblockUser(user._id)}
                          className="touch-target"
                          style={styles.unblockButton}
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
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Security</h2>
              <p style={styles.sectionDescription}>Manage your account security and authentication</p>

              {/* Two-Factor Authentication */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Two-Factor Authentication</h3>
                <div style={styles.toggleItem}>
                  <div>
                    <div style={styles.toggleLabel}>
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                    <div style={styles.toggleDescription}>
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className="touch-target"
                    style={{
                      ...styles.secondaryButton,
                      ...(twoFactorEnabled ? { background: '#ef4444', borderColor: '#ef4444' } : {})
                    }}
                  >
                    {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>

              {/* Passkey Settings */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Passkeys</h3>
                <PasskeySettings />
              </div>

              {/* Active Sessions */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Active Sessions</h3>
                <div style={styles.sessionsList}>
                  {activeSessions.map(session => (
                    <div key={session.id} style={styles.sessionItem}>
                      <div style={styles.sessionInfo}>
                        <div style={styles.sessionDevice}>{session.device}</div>
                        <div style={styles.sessionDetails}>
                          {session.location} • {session.lastActive}
                          {session.current && <span style={styles.currentBadge}>Current</span>}
                        </div>
                      </div>
                      {!session.current && (
                        <button className="touch-target" style={styles.secondaryButton}>
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Login History */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Login History</h3>
                <div style={styles.historyList}>
                  {loginHistory.map(login => (
                    <div key={login.id} style={styles.historyItem}>
                      <div style={styles.historyDot}></div>
                      <div style={styles.historyInfo}>
                        <div style={styles.historyDevice}>{login.device}</div>
                        <div style={styles.historyDetails}>
                          {login.location} • {login.timestamp}
                        </div>
                      </div>
                      <div style={{
                        ...styles.statusBadge,
                        background: login.status === 'success' ? '#10b98120' : '#ef444420',
                        color: login.status === 'success' ? '#10b981' : '#ef4444'
                      }}>
                        {login.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Notification Preferences</h2>
              <p style={styles.sectionDescription}>Choose what notifications you want to receive</p>

              <form onSubmit={handleNotificationSubmit} style={styles.form}>
                <div style={styles.toggleGroup}>
                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Friend Requests</div>
                      <div style={styles.toggleDescription}>When someone sends you a friend request</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.friend_requests}
                        onChange={(e) => handleNotificationChange('friend_requests', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Friend Accepted</div>
                      <div style={styles.toggleDescription}>When someone accepts your friend request</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.friend_accepted}
                        onChange={(e) => handleNotificationChange('friend_accepted', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>New Follower</div>
                      <div style={styles.toggleDescription}>When someone follows you</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.new_follower}
                        onChange={(e) => handleNotificationChange('new_follower', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Messages</div>
                      <div style={styles.toggleDescription}>When you receive a new message</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.messages}
                        onChange={(e) => handleNotificationChange('messages', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Mentions</div>
                      <div style={styles.toggleDescription}>When someone mentions you</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.mentions}
                        onChange={(e) => handleNotificationChange('mentions', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Comments</div>
                      <div style={styles.toggleDescription}>When someone comments on your posts</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.comments}
                        onChange={(e) => handleNotificationChange('comments', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Likes</div>
                      <div style={styles.toggleDescription}>When someone likes your content</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.likes}
                        onChange={(e) => handleNotificationChange('likes', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Shares</div>
                      <div style={styles.toggleDescription}>When someone shares your content</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.shares}
                        onChange={(e) => handleNotificationChange('shares', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>System Updates</div>
                      <div style={styles.toggleDescription}>Important updates about the platform</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.system_updates}
                        onChange={(e) => handleNotificationChange('system_updates', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Newsletter</div>
                      <div style={styles.toggleDescription}>Receive our weekly newsletter</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={notificationPreferences.newsletter}
                        onChange={(e) => handleNotificationChange('newsletter', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={notificationLoading}
                  className="touch-target"
                  style={{
                    ...styles.submitButton,
                    ...(notificationLoading ? styles.submitButtonDisabled : {})
                  }}
                >
                  {notificationLoading ? 'Saving...' : 'Save Notification Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Appearance</h2>
              <p style={styles.sectionDescription}>Customize how the app looks and feels</p>

              <form onSubmit={handleAppearanceSubmit} style={styles.form}>
                {/* Theme Toggle */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Theme</h3>
                  <div style={styles.themeSelector}>
                    <ThemeToggle />
                    <p style={styles.themeDescription}>
                      Current theme: <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong>
                    </p>
                  </div>
                </div>

                {/* Language */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Language</label>
                  <select style={styles.select}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                {/* Accessibility Options */}
                <div style={styles.toggleGroup}>
                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Reduce Motion</div>
                      <div style={styles.toggleDescription}>Minimize animations and transitions</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={appearanceSettings.reduceMotion}
                        onChange={(e) => handleAppearanceChange('reduceMotion', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>High Contrast</div>
                      <div style={styles.toggleDescription}>Increase contrast for better visibility</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={appearanceSettings.highContrast}
                        onChange={(e) => handleAppearanceChange('highContrast', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>

                  <div style={styles.toggleItem}>
                    <div>
                      <div style={styles.toggleLabel}>Compact Mode</div>
                      <div style={styles.toggleDescription}>Reduce spacing for more content</div>
                    </div>
                    <label style={styles.switch}>
                      <input
                        type="checkbox"
                        checked={appearanceSettings.compactMode}
                        onChange={(e) => handleAppearanceChange('compactMode', e.target.checked)}
                        style={styles.switchInput}
                      />
                      <span style={styles.switchSlider}></span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={appearanceLoading}
                  className="touch-target"
                  style={{
                    ...styles.submitButton,
                    ...(appearanceLoading ? styles.submitButtonDisabled : {})
                  }}
                >
                  {appearanceLoading ? 'Saving...' : 'Save Appearance Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Integrations</h2>
              <p style={styles.sectionDescription}>Connect third-party apps and manage API access</p>

              {/* OAuth Settings */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Connected Apps</h3>
                <OAuthSettings />
              </div>

              {/* API Keys */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>API Keys</h3>
                <APIKeysSettings />
              </div>
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Web3 Wallet</h2>
              <p style={styles.sectionDescription}>Connect and manage your cryptocurrency wallets</p>

              {/* Wallet Connection */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Wallet Connection</h3>
                <div style={styles.walletSection}>
                  <WalletConnectButton />
                </div>
              </div>

              {/* Token Balances */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Token Balances</h3>
                <TokenBalanceDisplay />
              </div>

              {/* Wallet Addresses */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Saved Addresses</h3>
                <p style={styles.emptyState}>No saved wallet addresses yet</p>
                <button className="touch-target" style={styles.secondaryButton}>Add Address</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// CRYB Glass Morphism Theme Styles
// Add keyframes for animations
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  input[type="checkbox"]:checked + span {
    background-color: #58a6ff !important;
  }

  input[type="checkbox"]:checked + span::before {
    transform: translateX(24px) !important;
  }

  button:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  input:focus, textarea:focus, select:focus {
    border-color: #58a6ff !important;
  }

  .switch input:checked + span {
    background-color: #58a6ff;
  }

  .switch input:checked + span::before {
    transform: translateX(24px);
  }

  /* Mobile/Tablet responsive styles */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed !important;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100% !important;
      height: auto !important;
      border-right: none !important;
      border-top: 1px solid var(--border-color, #2d2d2d);
      padding: 12px 16px !important;
      padding-bottom: max(12px, env(safe-area-inset-bottom)) !important;
      z-index: 100;
      background: var(--bg-primary, #0A0A0B);
    }

    .sidebar h1 {
      display: none;
    }

    .sidebar nav {
      flex-direction: row !important;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      gap: 8px !important;
    }

    .sidebar nav button {
      flex-shrink: 0;
      padding: 8px 12px !important;
    }

    .sidebar nav button span:last-child {
      display: none;
    }

    main {
      padding: 20px 16px !important;
      padding-bottom: max(80px, calc(env(safe-area-inset-bottom) + 70px)) !important;
    }
  }

  @media (max-width: 480px) {
    .content h2 {
      font-size: 24px !important;
    }

    .interestsGrid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
    }
  }
`
document.head.appendChild(styleSheet)

export default SettingsPage
