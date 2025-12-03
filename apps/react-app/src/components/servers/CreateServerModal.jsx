import React, { useState, useRef, useEffect } from 'react'
import { X, Upload, Globe, Lock } from 'lucide-react'
import { Button, Input } from '../ui'
import serverService from '../../services/serverService'
import { useResponsive } from '../../hooks/useResponsive'

function CreateServerModal({ onClose, onServerCreated }) {
  const { isMobile } = useResponsive();
  const [step, setStep] = useState(1) // 1: Basic info, 2: Customization
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    icon: null,
    banner: null
  })

  const [iconPreview, setIconPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)

  const iconInputRef = useRef(null)
  const bannerInputRef = useRef(null)

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`${type} must be less than 5MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(`${type} must be an image`)
      return
    }

    // Create preview using object URL (faster and more memory-efficient than base64)
    const previewUrl = URL.createObjectURL(file)

    if (type === 'icon') {
      // Revoke old URL to prevent memory leaks
      if (iconPreview && iconPreview.startsWith('blob:')) {
        URL.revokeObjectURL(iconPreview)
      }
      setIconPreview(previewUrl)
      setFormData(prev => ({ ...prev, icon: file }))
    } else {
      // Revoke old URL to prevent memory leaks
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview)
      }
      setBannerPreview(previewUrl)
      setFormData(prev => ({ ...prev, banner: file }))
    }

    setError('')
  }

  const handleNext = () => {
    if (!formData.name.trim()) {
      setError('Server name is required')
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Server name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await serverService.createServer(formData)

      if (result.success) {
        onServerCreated(result.server)
      } else {
        setError(result.error || 'Failed to create server')
      }
    } catch (err) {
      console.error('Failed to create server:', err)
      setError('Failed to create server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: isMobile ? '16px' : '24px'
}}>
      <div style={{
  borderRadius: '24px',
  width: '100%'
}}>
        {/* Header */}
        <div style={{
  position: 'sticky',
  padding: isMobile ? '16px' : '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <h2 className={isMobile ? 'text-xl' : 'text-2xl'} style={{
  fontWeight: 'bold',
  color: '#ffffff'
}}>
            Create Server
          </h2>
          <button
            onClick={onClose}
            className={isMobile ? 'p-3 min-w-12 min-h-12' : 'p-2'}
            style={{
  borderRadius: '12px'
}}
          >
            <X style={{
  height: '20px',
  width: '20px'
}} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
  marginLeft: '24px',
  marginRight: '24px',
  padding: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div style={{
  padding: isMobile ? '16px' : '24px'
}} className="space-y-4">
              <div>
                <label className={isMobile ? 'text-sm' : 'text-sm md:text-base'} style={{
  display: 'block',
  fontWeight: '500',
  color: '#ffffff',
  marginBottom: '8px'
}}>
                  Server Name <span className="text-rgb(var(--color-error-500))">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="My Awesome Server"
                  maxLength={50}
                  autoFocus
                  className={isMobile ? 'h-12 text-base' : 'h-10 text-sm md:text-base'}
                />
                <p className="text-xs text-rgb(var(--color-neutral-500)) mt-1">
                  {formData.name.length}/50 characters
                </p>
              </div>

              <div>
                <label className={isMobile ? 'text-sm' : 'text-sm md:text-base'} style={{
  display: 'block',
  fontWeight: '500',
  color: '#ffffff',
  marginBottom: '8px'
}}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="What's your server about?"
                  rows={3}
                  maxLength={200}
                  className={isMobile ? 'text-base' : 'text-sm md:text-base'}
                  style={{
  width: '100%',
  paddingLeft: isMobile ? '12px' : '16px',
  paddingRight: isMobile ? '12px' : '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  minHeight: isMobile ? '96px' : '80px'
}}
                />
                <p className="text-xs text-rgb(var(--color-neutral-500)) mt-1">
                  {formData.description.length}/200 characters
                </p>
              </div>

              <div>
                <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#ffffff'
}}>
                  Server Type
                </label>
                <div className="space-y-sm">
                  <label style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
                    <input
                      type="radio"
                      name="isPublic"
                      checked={formData.isPublic === true}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                      className="mt-1"
                    />
                    <div style={{
  flex: '1'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: '500',
  color: '#ffffff'
}}>
                        <Globe style={{
  height: '16px',
  width: '16px'
}} />
                        Public
                      </div>
                      <p style={{
  color: '#A0A0A0'
}}>
                        Anyone can find and join your server
                      </p>
                    </div>
                  </label>

                  <label style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
                    <input
                      type="radio"
                      name="isPublic"
                      checked={formData.isPublic === false}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                      className="mt-1"
                    />
                    <div style={{
  flex: '1'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: '500',
  color: '#ffffff'
}}>
                        <Lock style={{
  height: '16px',
  width: '16px'
}} />
                        Private
                      </div>
                      <p style={{
  color: '#A0A0A0'
}}>
                        Only people with an invite can join
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Customization */}
          {step === 2 && (
            <div style={{
  padding: '24px'
}}>
              <div>
                <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#ffffff'
}}>
                  Server Icon
                </label>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
                  <div
                    style={{
  width: '80px',
  height: '80px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
}}
                    onClick={() => iconInputRef.current?.click()}
                  >
                    {iconPreview ? (
                      <img src={iconPreview} alt="Server icon" style={{
  width: '100%',
  height: '100%'
}} />
                    ) : (
                      <ImageIcon style={{
  height: '32px',
  width: '32px'
}} />
                    )}
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => iconInputRef.current?.click()}
                    >
                      <Upload style={{
  height: '16px',
  width: '16px'
}} />
                      Upload Icon
                    </Button>
                    <p className="text-xs text-rgb(var(--color-neutral-500)) mt-1">
                      Recommended: 512x512px, max 5MB
                    </p>
                  </div>
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'icon')}
                    style={{
  display: 'none'
}}
                  />
                </div>
              </div>

              <div>
                <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#ffffff'
}}>
                  Server Banner (Optional)
                </label>
                <div
                  style={{
  width: '100%',
  height: '128px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
}}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Server banner" style={{
  width: '100%',
  height: '100%'
}} />
                  ) : (
                    <div style={{
  textAlign: 'center'
}}>
                      <Upload style={{
  height: '32px',
  width: '32px'
}} />
                      <p style={{
  color: '#A0A0A0'
}}>
                        Click to upload banner
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-rgb(var(--color-neutral-500)) mt-1">
                  Recommended: 1920x480px, max 5MB
                </p>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'banner')}
                  style={{
  display: 'none'
}}
                />
              </div>

              <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
                <h4 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                  Server Preview
                </h4>
                <div style={{
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                    {iconPreview ? (
                      <img src={iconPreview} alt="" style={{
  width: '48px',
  height: '48px',
  borderRadius: '12px'
}} />
                    ) : (
                      <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                        {formData.name.charAt(0).toUpperCase() || 'S'}
                      </div>
                    )}
                    <div>
                      <h5 style={{
  fontWeight: 'bold',
  color: '#ffffff'
}}>
                        {formData.name || 'Server Name'}
                      </h5>
                      <p style={{
  color: '#A0A0A0'
}}>
                        {formData.description || 'No description'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
  position: 'sticky',
  padding: isMobile ? '16px' : '24px',
  display: 'flex',
  flexDirection: isMobile ? 'column' : 'row',
  gap: isMobile ? '12px' : '0',
  justifyContent: 'space-between'
}}>
            {step === 1 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className={isMobile ? 'w-full h-12' : ''}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  className={isMobile ? 'w-full h-12' : ''}
                >
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className={isMobile ? 'w-full h-12' : ''}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className={isMobile ? 'w-full h-12' : ''}
                >
                  Create Server
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}




export default CreateServerModal
