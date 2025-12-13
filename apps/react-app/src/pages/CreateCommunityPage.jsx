import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import communityService from '../services/communityService'
import fileUploadService from '../services/fileUploadService'
import { getErrorMessage } from '../utils/errorUtils'

function CreateCommunityPage() {
  const navigate = useNavigate()
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

  return (
    <div
      role="main"
      aria-label="Create community page"
      className="min-h-screen py-6 px-4 sm:py-10 sm:px-5"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="max-w-3xl mx-auto backdrop-blur-xl rounded-2xl p-6 sm:p-10 shadow-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        <h1 className="text-2xl sm:text-3xl mb-2.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent font-bold">
          Create Community
        </h1>
        <p className="mb-6 sm:mb-8" style={{ color: 'var(--text-secondary)' }}>Build your own community on CRYB</p>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-5 flex items-center gap-2.5">
            <CheckCircle size={20} />
            <span>Community created successfully! Redirecting...</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-5 flex items-center gap-2.5">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Community Name */}
          <div className="mb-5">
            <label className="block font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Community Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="mycommunity"
              className={`w-full p-3 rounded-2xl text-base outline-none transition-colors ${
                errors.name ? 'border-2 border-red-500' : ''
              }`}
              style={!errors.name ? { background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' } : { background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Display Name */}
          <div className="mb-5">
            <label className="block font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Display Name *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="My Awesome Community"
              className={`w-full p-3 rounded-2xl text-base outline-none transition-colors ${
                errors.displayName ? 'border-2 border-red-500' : ''
              }`}
              style={!errors.displayName ? { background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' } : { background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            />
            {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what your community is about..."
              rows={4}
              className={`w-full p-3 rounded-2xl text-base resize-y outline-none transition-colors ${
                errors.description ? 'border-2 border-red-500' : ''
              }`}
              style={!errors.description ? { background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' } : { background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Category */}
          <div className="mb-5">
            <label className="block font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-3 rounded-2xl text-base outline-none"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
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
          <div className="mb-5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                className="w-[18px] h-[18px] cursor-pointer accent-[#58a6ff]"
              />
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Private Community</span>
            </label>
            <p className="text-sm mt-1 ml-7" style={{ color: 'var(--text-secondary)' }}>
              Only approved members can view and post
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={creating || success}
            className={`w-full p-3.5 border-none rounded-2xl text-base font-semibold flex items-center justify-center gap-2.5 transition-opacity ${
              creating || success
                ? 'cursor-not-allowed'
                : 'bg-gradient-to-br from-[#58a6ff] to-[#a371f7] cursor-pointer'
            }`}
            style={creating || success ? { background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)' } : { color: 'var(--text-inverse)', boxShadow: 'var(--shadow-md)' }}
          >
            {success ? 'Created!' : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateCommunityPage

