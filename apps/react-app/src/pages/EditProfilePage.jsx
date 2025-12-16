import React, { memo, useState } from 'react'
import { useResponsive } from '../hooks/useResponsive'
import { useNavigate } from 'react-router-dom'

const EditProfilePage = () => {
  const { isMobile, isTablet } = useResponsive()
  const navigate = useNavigate()

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(URL.createObjectURL(file))
    }
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBanner(URL.createObjectURL(file))
    }
  }

  const handleSave = () => {
    console.log('Saving profile:', formData)
  }

  const handleCancel = () => {
    navigate(-1)
  }

  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px'
  const headerOffset = isMobile ? '56px' : '72px'

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
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
              color: 'var(--text-primary)'
            }}
          >
            Edit Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '14px' : '16px', margin: 0 }}>
            Customize your public profile information
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          {/* Banner & Avatar */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '160px',
                background: banner || 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
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
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
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
                  border: '4px solid var(--bg-secondary)',
                  background: avatar || 'var(--bg-tertiary)',
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
                  {avatar ? (
                    <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg style={{ width: '48px', height: '48px', color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px'
            }}
          >
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              Basic Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    height: '48px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    height: '48px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                      padding: '12px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      height: '48px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                      padding: '12px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      height: '48px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px'
            }}
          >
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              Social Links
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { name: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/username' },
                { name: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
                { name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' }
              ].map((social) => (
                <div key={social.name}>
                  <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                      padding: '12px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      height: '48px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px'
            }}
          >
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              Privacy
            </h2>
            <div>
              <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
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
                      padding: '12px',
                      background: formData.profileVisibility === option ? 'rgba(88, 166, 255, 0.1)' : 'var(--bg-tertiary)',
                      border: `1px solid ${formData.profileVisibility === option ? 'rgba(88, 166, 255, 0.3)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
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
                        border: `2px solid ${formData.profileVisibility === option ? '#58a6ff' : 'var(--border-subtle)'}`,
                        background: formData.profileVisibility === option ? '#58a6ff' : 'transparent',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {formData.profileVisibility === option && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                      )}
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', textTransform: 'capitalize' }}>{option}</span>
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
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                height: '48px',
                minWidth: '120px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                height: '48px',
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
