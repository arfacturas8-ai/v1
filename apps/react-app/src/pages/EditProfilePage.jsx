/**
 * EditProfilePage.jsx
 * Modernized edit profile page with iOS aesthetic
 * Features: Explicit light theme colors, inline styles, iOS-style components
 */

import React, { memo, useState, useEffect } from 'react'
import { useResponsive } from '../hooks/useResponsive'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { useToast } from '../contexts/ToastContext'

const EditProfilePage = () => {
  const { isMobile, isTablet } = useResponsive()
  const navigate = useNavigate()
  const { user: currentUser, refreshUser } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    github: '',
    linkedin: '',
    profileVisibility: 'public'
  })

  const [avatar, setAvatar] = useState(null)
  const [banner, setBanner] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)

  // Load current user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await apiService.get(`/users/${currentUser.id}`)
        if (response.success && response.data) {
          const userData = response.data
          setFormData({
            displayName: userData.displayName || '',
            username: userData.username || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || '',
            twitter: userData.socialLinks?.twitter || '',
            github: userData.socialLinks?.github || '',
            linkedin: userData.socialLinks?.linkedin || '',
            profileVisibility: userData.profileVisibility || 'public'
          })
          if (userData.avatar) setAvatar(userData.avatar)
          if (userData.banner) setBanner(userData.banner)
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
        showToast('Failed to load profile data', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [currentUser])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      setAvatar(URL.createObjectURL(file))
    }
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBannerFile(file)
      setBanner(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!currentUser) {
      showToast('You must be logged in to edit your profile', 'error')
      return
    }

    setSaving(true)
    try {
      // Prepare form data for file uploads
      const updateData = new FormData()
      updateData.append('displayName', formData.displayName)
      updateData.append('username', formData.username)
      updateData.append('bio', formData.bio)
      updateData.append('location', formData.location)
      updateData.append('website', formData.website)
      updateData.append('socialLinks', JSON.stringify({
        twitter: formData.twitter,
        github: formData.github,
        linkedin: formData.linkedin
      }))
      updateData.append('profileVisibility', formData.profileVisibility)

      // Add avatar if changed
      if (avatarFile) {
        updateData.append('avatar', avatarFile)
      }

      // Add banner if changed
      if (bannerFile) {
        updateData.append('banner', bannerFile)
      }

      const response = await apiService.put(`/users/${currentUser.id}`, updateData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.success) {
        showToast('Profile updated successfully!', 'success')
        await refreshUser() // Refresh user context
        navigate(-1) // Go back to previous page
      } else {
        throw new Error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      showToast(error.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div
        style={{
          background: '#FAFAFA',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: isMobile ? '56px' : '72px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(88, 166, 255, 0.2)',
              borderTop: '4px solid #58a6ff',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }}
          />
          <p style={{ color: '#666666', fontSize: '15px' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px'
  const headerOffset = isMobile ? '56px' : '72px'

  return (
    <div
      style={{
        background: '#FAFAFA',
        minHeight: '100vh',
        paddingTop: headerOffset
      }}
      role="main"
      aria-label="Edit profile page"
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: `${padding} ${isMobile ? '16px' : isTablet ? '24px' : '32px'}`
        }}
      >
        <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
          <h1
            style={{
              fontSize: isMobile ? '28px' : '40px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#000000'
            }}
          >
            Edit Profile
          </h1>
          <p style={{ color: '#666666', fontSize: isMobile ? '14px' : '16px', margin: 0 }}>
            Customize your public profile information
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          {/* Banner & Avatar */}
          <div
            style={{
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div
              style={{
                height: '160px',
                background: banner ? `url(${banner})` : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                style={{ display: 'none' }}
                id="banner-upload"
              />
              <label
                htmlFor="banner-upload"
                style={{
                  padding: '8px 16px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 500,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)' }}
              >
                <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Change Banner
              </label>
            </div>
            <div style={{ padding: isMobile ? '16px' : '24px', paddingTop: '48px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '-48px',
                  left: isMobile ? '16px' : '24px',
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  border: '4px solid white',
                  background: avatar ? `url(${avatar})` : '#E5E5E5',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!avatar && (
                    <svg style={{ width: '48px', height: '48px', color: '#666666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div
            style={{
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h2 style={{ color: '#000000', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              Basic Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#666666', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
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
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#000000' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#666666', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="@username"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '12px',
                    color: '#000000',
                    fontSize: '15px',
                    outline: 'none',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#000000' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#666666', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '12px',
                    color: '#000000',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#000000' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#666666', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
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
                      minHeight: '48px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#000000' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666666', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '12px',
                      color: '#000000',
                      fontSize: '15px',
                      outline: 'none',
                      minHeight: '48px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#000000' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div
            style={{
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h2 style={{ color: '#000000', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              Social Links
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { name: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/username' },
                { name: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
                { name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' }
              ].map((social) => (
                <div key={social.name}>
                  <label style={{ display: 'block', color: '#666666', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    {social.label}
                  </label>
                  <input
                    type="url"
                    name={social.name}
                    value={formData[social.name]}
                    onChange={handleChange}
                    placeholder={social.placeholder}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRadius: '12px',
                      color: '#000000',
                      fontSize: '15px',
                      outline: 'none',
                      minHeight: '48px',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#000000' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div
            style={{
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h2 style={{ color: '#000000', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              Privacy
            </h2>
            <div>
              <label style={{ display: 'block', color: '#666666', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Profile Visibility
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['public', 'friends', 'private'].map((option) => (
                  <label
                    key={option}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: formData.profileVisibility === option ? 'rgba(99, 102, 241, 0.1)' : 'white',
                      border: `1px solid ${formData.profileVisibility === option ? '#000000' : 'rgba(0, 0, 0, 0.06)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '48px'
                    }}
                    onMouseEnter={(e) => {
                      if (formData.profileVisibility !== option) {
                        e.currentTarget.style.background = '#FAFAFA'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (formData.profileVisibility !== option) {
                        e.currentTarget.style.background = 'white'
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="profileVisibility"
                      value={option}
                      checked={formData.profileVisibility === option}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${formData.profileVisibility === option ? '#000000' : 'rgba(0, 0, 0, 0.2)'}`,
                        background: formData.profileVisibility === option ? '#000000' : 'transparent',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      {formData.profileVisibility === option && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                      )}
                    </div>
                    <span style={{ color: '#000000', fontSize: '15px', textTransform: 'capitalize', fontWeight: 500 }}>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#666666',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '120px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '120px',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(EditProfilePage)
