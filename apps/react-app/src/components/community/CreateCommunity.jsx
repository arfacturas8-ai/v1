import React, { useState, useEffect } from 'react'
import {
  Users, Globe, Lock, Hash, Image, X,
  FileText, Shield, Award, Settings
} from 'lucide-react'
import communityService from '../../services/communityService'
import { useResponsive } from '../../hooks/useResponsive'


export default function CreateCommunity({ onClose, onCreate }) {
  const { isMobile } = useResponsive();
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [communityData, setCommunityData] = useState({
    name: '',
    displayName: '',
    description: '',
    type: 'public',
    category: 'general',
    banner: null,
    icon: null,
    rules: [''],
    features: {
      posts: true,
      voice: true,
      events: false,
      marketplace: false
    },
    requirements: {
      minKarma: 0,
      minAccountAge: 0,
      emailVerified: false
    }
  })

  // Separate state for image previews
  const [iconPreview, setIconPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (iconPreview && iconPreview.startsWith('blob:')) {
        URL.revokeObjectURL(iconPreview)
      }
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview)
      }
    }
  }, [iconPreview, bannerPreview])

  const categories = [
    'general', 'gaming', 'technology', 'art', 'music', 
    'education', 'sports', 'entertainment', 'business', 'other'
  ]

  const handleInputChange = (field, value) => {
    setCommunityData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFeatureToggle = (feature) => {
    setCommunityData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }))
  }

  const handleRuleChange = (index, value) => {
    const newRules = [...communityData.rules]
    newRules[index] = value
    setCommunityData(prev => ({
      ...prev,
      rules: newRules
    }))
  }

  const addRule = () => {
    setCommunityData(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }))
  }

  const removeRule = (index) => {
    setCommunityData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }))
  }

  const handleImageUpload = (type, file) => {
    if (file) {
      // Store the file object (not base64)
      setCommunityData(prev => ({
        ...prev,
        [type]: file
      }))

      // Create preview using object URL (faster and more memory-efficient than base64)
      const previewUrl = URL.createObjectURL(file)

      if (type === 'icon') {
        if (iconPreview && iconPreview.startsWith('blob:')) {
          URL.revokeObjectURL(iconPreview)
        }
        setIconPreview(previewUrl)
      } else if (type === 'banner') {
        if (bannerPreview && bannerPreview.startsWith('blob:')) {
          URL.revokeObjectURL(bannerPreview)
        }
        setBannerPreview(previewUrl)
      }
    }
  }

  const handleRemoveImage = (type) => {
    // Revoke the preview URL
    if (type === 'icon' && iconPreview && iconPreview.startsWith('blob:')) {
      URL.revokeObjectURL(iconPreview)
      setIconPreview(null)
    } else if (type === 'banner' && bannerPreview && bannerPreview.startsWith('blob:')) {
      URL.revokeObjectURL(bannerPreview)
      setBannerPreview(null)
    }

    // Remove from data
    handleInputChange(type, null)
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!communityData.name || !communityData.displayName) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Format the data for the API
      const apiData = {
        name: communityData.name.toLowerCase().replace(/\s+/g, '-'),
        displayName: communityData.displayName,
        description: communityData.description,
        category: communityData.category,
        isPublic: communityData.type === 'public',
        allowPosts: communityData.features.posts,
        requireApproval: communityData.requirements.minKarma > 0 || communityData.requirements.emailVerified,
        rules: communityData.rules.filter(rule => rule.trim()),
        icon: communityData.icon,
        banner: communityData.banner
      }

      const result = await communityService.createCommunity(apiData)
      
      if (result.success) {
        onCreate(result.community)
        onClose()
      } else {
        setError(result.error || 'Failed to create community')
      }
    } catch (error) {
      console.error('Failed to create community:', error)
      setError('Failed to create community. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isValid = communityData.name && communityData.displayName && communityData.description

  return (
    <div className="create-community-overlay">
      <div className="create-community-modal">
        <div className="modal-header">
          <h2>Create Community</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="modal-body">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="step-content">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label className={isMobile ? 'text-sm' : 'text-sm md:text-base'}>
                  Community Name <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <span className="prefix">c/</span>
                  <input
                    type="text"
                    value={communityData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="community-name"
                    pattern="[a-z0-9-]+"
                    className={isMobile ? 'h-12 text-base' : 'h-10 text-sm md:text-base'}
                  />
                </div>
                <span className="hint">
                  Lowercase letters, numbers, and hyphens only
                </span>
              </div>

              <div className="form-group">
                <label className={isMobile ? 'text-sm' : 'text-sm md:text-base'}>
                  Display Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={communityData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Community Display Name"
                  className={isMobile ? 'h-12 text-base' : 'h-10 text-sm md:text-base'}
                />
              </div>

              <div className="form-group">
                <label className={isMobile ? 'text-sm' : 'text-sm md:text-base'}>
                  Description <span className="required">*</span>
                </label>
                <textarea
                  value={communityData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="What's your community about?"
                  rows={4}
                  className={isMobile ? 'text-base min-h-24' : 'text-sm md:text-base'}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={communityData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Privacy & Access */}
          {step === 2 && (
            <div className="step-content">
              <h3>Privacy & Access</h3>
              
              <div className="community-types">
                <label className={`type-option ${communityData.type === 'public' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="public"
                    checked={communityData.type === 'public'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  />
                  <Globe size={24} />
                  <div>
                    <strong>Public</strong>
                    <p>Anyone can view and join</p>
                  </div>
                </label>

                <label className={`type-option ${communityData.type === 'restricted' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="restricted"
                    checked={communityData.type === 'restricted'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  />
                  <Shield size={24} />
                  <div>
                    <strong>Restricted</strong>
                    <p>Anyone can view, approval required to join</p>
                  </div>
                </label>

                <label className={`type-option ${communityData.type === 'private' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="private"
                    checked={communityData.type === 'private'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  />
                  <Lock size={24} />
                  <div>
                    <strong>Private</strong>
                    <p>Invite only</p>
                  </div>
                </label>
              </div>

              <div className="requirements-section">
                <h4>Join Requirements</h4>
                
                <div className="requirement-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={communityData.requirements.emailVerified}
                      onChange={(e) => setCommunityData(prev => ({
                        ...prev,
                        requirements: {
                          ...prev.requirements,
                          emailVerified: e.target.checked
                        }
                      }))}
                    />
                    Require email verification
                  </label>
                </div>

                <div className="requirement-item">
                  <label className={isMobile ? 'text-sm' : 'text-sm md:text-base'}>Minimum karma</label>
                  <input
                    type="number"
                    min="0"
                    value={communityData.requirements.minKarma}
                    onChange={(e) => setCommunityData(prev => ({
                      ...prev,
                      requirements: {
                        ...prev.requirements,
                        minKarma: parseInt(e.target.value) || 0
                      }
                    }))}
                    className={isMobile ? 'h-12 text-base' : 'h-10 text-sm md:text-base'}
                  />
                </div>

                <div className="requirement-item">
                  <label className={isMobile ? 'text-sm' : 'text-sm md:text-base'}>Minimum account age (days)</label>
                  <input
                    type="number"
                    min="0"
                    value={communityData.requirements.minAccountAge}
                    onChange={(e) => setCommunityData(prev => ({
                      ...prev,
                      requirements: {
                        ...prev.requirements,
                        minAccountAge: parseInt(e.target.value) || 0
                      }
                    }))}
                    className={isMobile ? 'h-12 text-base' : 'h-10 text-sm md:text-base'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Appearance */}
          {step === 3 && (
            <div className="step-content">
              <h3>Appearance</h3>
              
              <div className="appearance-section">
                <div className="upload-section">
                  <label>Community Icon</label>
                  <div className="upload-area">
                    {iconPreview ? (
                      <div className="preview-container">
                        <img src={iconPreview} alt="Icon" />
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveImage('icon')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="upload-label">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('icon', e.target.files[0])}
                          hidden
                        />
                        <Image size={32} />
                        <span>Upload Icon</span>
                        <span className="hint">256x256px recommended</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="upload-section">
                  <label>Banner Image</label>
                  <div className="upload-area banner">
                    {bannerPreview ? (
                      <div className="preview-container">
                        <img src={bannerPreview} alt="Banner" />
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveImage('banner')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="upload-label">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('banner', e.target.files[0])}
                          hidden
                        />
                        <Image size={32} />
                        <span>Upload Banner</span>
                        <span className="hint">1920x300px recommended</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Rules & Features */}
          {step === 4 && (
            <div className="step-content">
              <h3>Rules & Features</h3>
              
              <div className="features-section">
                <h4>Community Features</h4>
                <div className="features-grid">
                  <label className="feature-toggle">
                    <input
                      type="checkbox"
                      checked={communityData.features.posts}
                      onChange={() => handleFeatureToggle('posts')}
                    />
                    <FileText size={20} />
                    <span>Posts & Discussions</span>
                  </label>
                  
                  <label className="feature-toggle">
                    <input
                      type="checkbox"
                      checked={communityData.features.voice}
                      onChange={() => handleFeatureToggle('voice')}
                    />
                    <Hash size={20} />
                    <span>Voice Channels</span>
                  </label>
                  
                  <label className="feature-toggle">
                    <input
                      type="checkbox"
                      checked={communityData.features.events}
                      onChange={() => handleFeatureToggle('events')}
                    />
                    <Award size={20} />
                    <span>Events</span>
                  </label>
                  
                  <label className="feature-toggle">
                    <input
                      type="checkbox"
                      checked={communityData.features.marketplace}
                      onChange={() => handleFeatureToggle('marketplace')}
                    />
                    <Settings size={20} />
                    <span>Marketplace</span>
                  </label>
                </div>
              </div>

              <div className="rules-section">
                <h4>Community Rules</h4>
                {communityData.rules.map((rule, index) => (
                  <div key={index} className="rule-input">
                    <span className="rule-number">{index + 1}.</span>
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => handleRuleChange(index, e.target.value)}
                      placeholder="Enter a rule..."
                      className={isMobile ? 'h-12 text-base' : 'h-10 text-sm md:text-base'}
                    />
                    {communityData.rules.length > 1 && (
                      <button
                        className={`remove-rule ${isMobile ? 'min-w-12 min-h-12 p-3' : 'p-2'}`}
                        onClick={() => removeRule(index)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button className="add-rule" onClick={addRule}>
                  + Add Rule
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`modal-footer ${isMobile ? 'flex-col gap-3 p-4' : 'flex-row gap-0 p-6'}`}>
          {error && (
            <div className="error-message">
              {typeof error === 'string' ? error : 'An error occurred'}
            </div>
          )}

          {step > 1 && (
            <button
              className={`btn-secondary ${isMobile ? 'w-full h-12' : ''}`}
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              Previous
            </button>
          )}

          {step < 4 ? (
            <button
              className={`btn-primary ${isMobile ? 'w-full h-12' : ''}`}
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !isValid) || loading}
            >
              Next
            </button>
          ) : (
            <button
              className={`btn-create ${isMobile ? 'w-full h-12' : ''}`}
              onClick={handleSubmit}
              disabled={loading || !isValid}
            >
              {loading ? 'Creating...' : 'Create Community'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
