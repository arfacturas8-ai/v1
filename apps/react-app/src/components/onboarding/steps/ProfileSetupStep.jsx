import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import { useResponsive } from '../../../hooks/useResponsive'

const ProfileSetupStep = ({ onComplete, onSkip }) => {
  const { user, updateUser } = useAuth()
  const { isMobile } = useResponsive()
  const [profileData, setProfileData] = useState({
    bio: '',
    location: '',
    website: '',
    interests: [],
    avatar: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const INTEREST_OPTIONS = [
    'Technology', 'Gaming', 'Art', 'Music', 'Sports', 'Travel',
    'Food', 'Photography', 'Science', 'Books', 'Movies', 'Fitness',
    'Cryptocurrency', 'NFTs', 'DeFi', 'Web3', 'Programming', 'Design'
  ]

  useEffect(() => {
    if (user) {
      setProfileData({
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        interests: user.interests || [],
        avatar: null
      })
    }
  }, [user])

  // Cleanup object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleInterestToggle = (interest) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfileData(prev => ({ ...prev, avatar: file }))

      // Create preview using object URL (faster and more memory-efficient than base64)
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Update profile via API
      const formData = new FormData()
      Object.keys(profileData).forEach(key => {
        if (key === 'interests') {
          formData.append(key, JSON.stringify(profileData[key]))
        } else if (key === 'avatar' && profileData[key]) {
          formData.append(key, profileData[key])
        } else if (profileData[key]) {
          formData.append(key, profileData[key])
        }
      })

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateUser(updatedUser.user)
        onComplete()
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      // Still allow progression - this is onboarding
      onComplete()
    } finally {
      setIsLoading(false)
    }
  }

  const canComplete = profileData.bio.trim().length > 0 || profileData.interests.length > 0

  return (
    <div style={{
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
      <div style={{
  textAlign: 'center'
}}>
        <h3 style={{
  fontWeight: 'bold',
  color: '#c9d1d9'
}}>Set Up Your Profile</h3>
        <p style={{
  color: '#c9d1d9'
}}>
          Tell the community about yourself. This helps others discover and connect with you.
        </p>
      </div>

      <div className="space-y-6">
        {/* Avatar Upload */}
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  position: 'relative'
}}>
            <div style={{
  width: '96px',
  height: '96px',
  borderRadius: '50%',
  overflow: 'hidden',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" style={{
  width: '100%',
  height: '100%'
}} />
              ) : user?.avatar ? (
                <img src={user.avatar} alt="Current avatar" style={{
  width: '100%',
  height: '100%'
}} />
              ) : (
                <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#c9d1d9'
}}>
                  <svg style={{
  width: '32px',
  height: '32px'
}} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <label style={{
  position: 'absolute',
  color: '#ffffff',
  padding: '8px',
  borderRadius: '50%'
}}>
              <svg style={{
  width: '16px',
  height: '16px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="file"
                style={{
  display: 'none'
}}
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <p style={{
  color: '#c9d1d9'
}}>Click to upload your profile picture</p>
        </div>

        {/* Bio */}
        <div>
          <label className={isMobile ? 'text-sm mb-2' : 'text-sm md:text-base mb-2'} style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
            Tell us about yourself
          </label>
          <textarea
            value={profileData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Share something interesting about yourself..."
            className={isMobile ? 'text-base' : 'text-sm md:text-base'}
            style={{
  width: '100%',
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  minHeight: isMobile ? '96px' : '80px'
}}
            rows={3}
            maxLength={500}
          />
          <p style={{
  color: '#c9d1d9'
}}>
            {profileData.bio.length}/500 characters
          </p>
        </div>

        {/* Location and Website */}
        <div style={{
  display: 'grid',
  gap: '16px'
}}>
          <div>
            <label className={isMobile ? 'text-sm mb-2' : 'text-sm md:text-base mb-2'} style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
              Location (optional)
            </label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, Country"
              className={isMobile ? 'h-12 text-base' : 'h-10 text-sm md:text-base'}
              style={{
  width: '100%',
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
            />
          </div>
          <div>
            <label className={isMobile ? 'text-sm mb-2' : 'text-sm md:text-base mb-2'} style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
              Website (optional)
            </label>
            <input
              type="url"
              value={profileData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://..."
              className={isMobile ? 'h-12 text-base' : 'h-10 text-sm md:text-base'}
              style={{
  width: '100%',
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
            />
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className={isMobile ? 'text-sm mb-2' : 'text-sm md:text-base mb-2'} style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
            What are your interests? (Select up to 6)
          </label>
          <div style={{
  display: 'grid',
  gap: '8px'
}}>
            {INTEREST_OPTIONS.map(interest => (
              <button
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                disabled={!profileData.interests.includes(interest) && profileData.interests.length >= 6}
                className={isMobile ? 'min-h-12 text-base' : 'min-h-10 text-sm md:text-base'}
                style={{
  padding: '8px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#c9d1d9'
}}
              >
                {interest}
              </button>
            ))}
          </div>
          <p style={{
  color: '#c9d1d9'
}}>
            Selected: {profileData.interests.length}/6
          </p>
        </div>
      </div>

      <div style={{
  display: 'flex',
  flexDirection: isMobile ? 'column' : 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: isMobile ? '12px' : '0',
  marginTop: '24px'
}}>
        <button
          onClick={onSkip}
          className={isMobile ? 'w-full h-12' : ''}
          style={{
  color: '#c9d1d9',
  padding: isMobile ? '12px' : '8px'
}}
        >
          Skip for now
        </button>

        <button
          onClick={handleSave}
          disabled={!canComplete || isLoading}
          className={isMobile ? 'w-full h-12' : ''}
          style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: isMobile ? '12px' : '8px',
  paddingBottom: isMobile ? '12px' : '8px',
  borderRadius: '12px',
  fontWeight: '500',
  color: '#c9d1d9',
  background: 'rgba(22, 27, 34, 0.6)'
}}
        >
          {isLoading ? (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              <div style={{
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}}></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save & Continue'
          )}
        </button>
      </div>
    </div>
  )
}




export default ProfileSetupStep
