/**
 * CreateCommunityPage.jsx
 * iOS-inspired modern design with clean aesthetics
 * Updated: 2025-12-19
 */

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, AlertCircle, CheckCircle, Loader, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import communityService from '../services/communityService'
import fileUploadService from '../services/fileUploadService'
import { getErrorMessage } from '../utils/errorUtils'

function CreateCommunityPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin'

  // Redirect non-admins after mount
  useEffect(() => {
    if (user && !isAdmin) {
      setTimeout(() => navigate('/home'), 2000)
    }
  }, [user, isAdmin, navigate])
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: 'general',
    isPrivate: false,
    rules: [''],
    icon: null,
    banner: null
  })
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [iconPreview, setIconPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const iconInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  // Validation function
  const validateForm = () => {
    const newErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Community name must be at least 3 characters'
    } else if (formData.name.length > 21) {
      newErrors.name = 'Community name must be less than 21 characters'
    }

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    } else if (formData.displayName.length > 100) {
      newErrors.displayName = 'Display name must be less than 100 characters'
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    // Icon validation
    if (formData.icon) {
      const iconValidation = fileUploadService.validateFile(formData.icon, 'image')
      if (iconValidation.length > 0) {
        newErrors.icon = iconValidation[0]
      }
    }

    // Banner validation
    if (formData.banner) {
      const bannerValidation = fileUploadService.validateFile(formData.banner, 'image')
      if (bannerValidation.length > 0) {
        newErrors.banner = bannerValidation[0]
      }
    }

    // Rules validation
    const validRules = formData.rules.filter(rule => rule.trim() !== '')
    if (validRules.length > 0 && validRules.some(rule => rule.length > 500)) {
      newErrors.rules = 'Each rule must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    setErrorMessage('')
  }

  // Handle file upload
  const handleFileChange = async (field, file) => {
    if (!file) return

    const validation = fileUploadService.validateFile(file, 'image')
    if (validation.length > 0) {
      setErrors(prev => ({ ...prev, [field]: validation[0] }))
      return
    }

    setFormData(prev => ({ ...prev, [field]: file }))

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      if (field === 'icon') {
        setIconPreview(e.target.result)
      } else if (field === 'banner') {
        setBannerPreview(e.target.result)
      }
    }
    reader.onerror = () => {
      console.error('Failed to read file')
      setErrors(prev => ({ ...prev, [field]: 'Failed to read file. Please try again.' }))
    }
    reader.readAsDataURL(file)

    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Remove file
  const handleRemoveFile = (field) => {
    setFormData(prev => ({ ...prev, [field]: null }))
    if (field === 'icon') {
      setIconPreview(null)
      if (iconInputRef.current) iconInputRef.current.value = ''
    } else if (field === 'banner') {
      setBannerPreview(null)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  // Handle rules
  const handleRuleChange = (index, value) => {
    const newRules = [...formData.rules]
    newRules[index] = value
    setFormData(prev => ({ ...prev, rules: newRules }))
    if (errors.rules) {
      setErrors(prev => ({ ...prev, rules: '' }))
    }
  }

  const addRule = () => {
    setFormData(prev => ({ ...prev, rules: [...prev.rules, ''] }))
  }

  const removeRule = (index) => {
    if (formData.rules.length > 1) {
      setFormData(prev => ({
        ...prev,
        rules: prev.rules.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      setErrorMessage('Please fix the errors before submitting')
      return
    }

    setCreating(true)
    setErrorMessage('')

    try {
      // Prepare data for API
      const communityData = {
        name: formData.name.trim(),
        displayName: formData.displayName.trim(),
        description: formData.description.trim(),
        category: formData.category,
        isPublic: !formData.isPrivate,
        rules: formData.rules.filter(rule => rule.trim() !== ''),
        icon: formData.icon,
        banner: formData.banner
      }

      // Call the API service
      const result = await communityService.createCommunity(communityData)

      if (result.success) {
        setSuccess(true)

        // Redirect to the new community after a short delay
        setTimeout(() => {
          navigate(`/c/${formData.name}`)
        }, 1000)
      } else {
        setErrorMessage(getErrorMessage(result.error, 'Failed to create community. Please try again.'))
        setCreating(false)
      }
    } catch (error) {
      console.error('Error creating community:', error)
      setErrorMessage('An unexpected error occurred. Please try again.')
      setCreating(false)
    }
  }

  // Show admin-only message
  if (!isAdmin) {
    return (
      <div
        role="main"
        style={{
          minHeight: '100vh',
          padding: '48px 16px',
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{
          maxWidth: '480px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '20px',
          padding: '48px 40px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#FAFAFA',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Lock size={32} color="#666666" />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1A1A1A',
            marginBottom: '12px'
          }}>
            Admin Access Required
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#666666',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            Only administrators can create communities. If you believe you should have access, please contact support.
          </p>
          <button
            onClick={() => navigate('/home')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="main"
      aria-label="Create community page"
      style={{
        minHeight: '100vh',
        padding: '48px 16px',
        background: '#FAFAFA'
      }}
    >
      <div style={{
        maxWidth: '768px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Create Community
        </h1>
        <p style={{ marginBottom: '32px', color: '#666' }}>Build your own community on CRYB</p>

        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22C55E',
            padding: '16px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CheckCircle size={20} />
            <span>Community created successfully! Redirecting...</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            padding: '16px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Community Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
              Community Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="mycommunity"
              style={{
                width: '100%',
                height: '52px',
                padding: '0 16px',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s',
                background: 'white',
                border: errors.name ? '2px solid #EF4444' : '1px solid #E5E5E5',
                color: '#000'
              }}
            />
            {errors.name && <p style={{ color: '#EF4444', fontSize: '14px', marginTop: '8px' }}>{errors.name}</p>}
          </div>

          {/* Display Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
              Display Name *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="My Awesome Community"
              style={{
                width: '100%',
                height: '52px',
                padding: '0 16px',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s',
                background: 'white',
                border: errors.displayName ? '2px solid #EF4444' : '1px solid #E5E5E5',
                color: '#000'
              }}
            />
            {errors.displayName && <p style={{ color: '#EF4444', fontSize: '14px', marginTop: '8px' }}>{errors.displayName}</p>}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what your community is about..."
              rows={4}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '16px',
                resize: 'vertical',
                outline: 'none',
                transition: 'all 0.2s',
                background: 'white',
                border: errors.description ? '2px solid #EF4444' : '1px solid #E5E5E5',
                color: '#000',
                lineHeight: '1.5'
              }}
            />
            {errors.description && <p style={{ color: '#EF4444', fontSize: '14px', marginTop: '8px' }}>{errors.description}</p>}
          </div>

          {/* Category */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              style={{
                width: '100%',
                height: '52px',
                padding: '0 16px',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                background: 'white',
                border: '1px solid #E5E5E5',
                color: '#000'
              }}
            >
              <option value="general">General</option>
              <option value="gaming">Gaming</option>
              <option value="tech">Technology</option>
              <option value="art">Art & Design</option>
              <option value="music">Music</option>
              <option value="education">Education</option>
              <option value="business">Business</option>
              <option value="sports">Sports</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Privacy */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '600', color: '#000' }}>Private Community</span>
            </label>
            <p style={{ fontSize: '14px', marginTop: '8px', marginLeft: '32px', color: '#666' }}>
              Only approved members can view and post
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={creating || success}
            style={{
              width: '100%',
              height: '56px',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              cursor: creating || success ? 'not-allowed' : 'pointer',
              background: creating || success ? '#E5E5E5' : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
              color: 'white',
              boxShadow: creating || success ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!creating && !success) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!creating && !success) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
              }
            }}
          >
            {creating ? (
              <>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Creating...
              </>
            ) : success ? (
              'Created!'
            ) : (
              'Create Community'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateCommunityPage
