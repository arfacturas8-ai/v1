import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowLeft,
  ArrowRight,
  Check,
  Image as ImageIcon,
  Globe,
  Lock,
  Shield,
  Users,
  Eye,
  Palette
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import communityService from '../../services/communityService'
import fileUploadService from '../../services/fileUploadService'
import { getErrorMessage } from '../../utils/errorUtils'

interface FormData {
  name: string
  displayName: string
  description: string
  category: string
  privacy: 'public' | 'private' | 'restricted'
  nsfw: boolean
  icon: File | null
  banner: File | null
  rules: string[]
  primaryColor: string
  accentColor: string
}

const CreateCommunityPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    displayName: '',
    description: '',
    category: 'general',
    privacy: 'public',
    nsfw: false,
    icon: null,
    banner: null,
    rules: ['', '', ''],
    primaryColor: '#58a6ff',
    accentColor: '#a371f7'
  })
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const iconInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'general',
    'gaming',
    'technology',
    'art',
    'music',
    'sports',
    'education',
    'business',
    'entertainment',
    'science',
    'lifestyle',
    'finance'
  ]

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Name and description' },
    { number: 2, title: 'Appearance', description: 'Images and colors' },
    { number: 3, title: 'Privacy & Type', description: 'Visibility settings' },
    { number: 4, title: 'Rules', description: 'Community guidelines' },
    { number: 5, title: 'Review', description: 'Confirm and create' }
  ]

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Community name is required'
      } else if (formData.name.length < 3) {
        newErrors.name = 'Community name must be at least 3 characters'
      } else if (formData.name.length > 21) {
        newErrors.name = 'Community name must be less than 21 characters'
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
        newErrors.name = 'Only letters, numbers, underscores, and hyphens allowed'
      }

      if (!formData.displayName.trim()) {
        newErrors.displayName = 'Display name is required'
      } else if (formData.displayName.length > 100) {
        newErrors.displayName = 'Display name must be less than 100 characters'
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Description is required'
      } else if (formData.description.length < 10) {
        newErrors.description = 'Description must be at least 10 characters'
      } else if (formData.description.length > 500) {
        newErrors.description = 'Description must be less than 500 characters'
      }
    }

    if (step === 2) {
      if (formData.icon) {
        const validation = fileUploadService.validateFile(formData.icon, 'image')
        if (validation.length > 0) {
          newErrors.icon = validation[0]
        }
      }

      if (formData.banner) {
        const validation = fileUploadService.validateFile(formData.banner, 'image')
        if (validation.length > 0) {
          newErrors.banner = validation[0]
        }
      }
    }

    if (step === 4) {
      const validRules = formData.rules.filter((rule) => rule.trim() !== '')
      if (validRules.some((rule) => rule.length > 500)) {
        newErrors.rules = 'Each rule must be less than 500 characters'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    setErrorMessage('')
  }

  const handleFileChange = async (field: 'icon' | 'banner', file: File | null) => {
    if (!file) return

    const validation = fileUploadService.validateFile(file, 'image')
    if (validation.length > 0) {
      setErrors((prev) => ({ ...prev, [field]: validation[0] }))
      return
    }

    setFormData((prev) => ({ ...prev, [field]: file }))

    const reader = new FileReader()
    reader.onload = (e) => {
      if (field === 'icon') {
        setIconPreview(e.target?.result as string)
      } else if (field === 'banner') {
        setBannerPreview(e.target?.result as string)
      }
    }
    reader.onerror = () => {
      console.error('Failed to read file')
      setErrors((prev) => ({ ...prev, [field]: 'Failed to read file. Please try again.' }))
    }
    reader.readAsDataURL(file)

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleRemoveFile = (field: 'icon' | 'banner') => {
    setFormData((prev) => ({ ...prev, [field]: null }))
    if (field === 'icon') {
      setIconPreview(null)
      if (iconInputRef.current) iconInputRef.current.value = ''
    } else if (field === 'banner') {
      setBannerPreview(null)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...formData.rules]
    newRules[index] = value
    setFormData((prev) => ({ ...prev, rules: newRules }))
    if (errors.rules) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.rules
        return newErrors
      })
    }
  }

  const addRule = () => {
    setFormData((prev) => ({ ...prev, rules: [...prev.rules, ''] }))
  }

  const removeRule = (index: number) => {
    if (formData.rules.length > 1) {
      setFormData((prev) => ({
        ...prev,
        rules: prev.rules.filter((_, i) => i !== index)
      }))
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setErrorMessage('Please fix the errors before submitting')
      return
    }

    if (!user) {
      navigate('/login')
      return
    }

    setCreating(true)
    setErrorMessage('')

    try {
      const communityData = {
        name: formData.name.trim(),
        displayName: formData.displayName.trim(),
        description: formData.description.trim(),
        category: formData.category,
        isPublic: formData.privacy === 'public',
        privacy: formData.privacy,
        nsfw: formData.nsfw,
        rules: formData.rules.filter((rule) => rule.trim() !== ''),
        icon: formData.icon,
        banner: formData.banner,
        primaryColor: formData.primaryColor,
        accentColor: formData.accentColor
      }

      const result = await communityService.createCommunity(communityData)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate(`/community/${formData.name}`)
        }, 1500)
      } else {
        setErrorMessage(getErrorMessage(result.error, 'Failed to create community. Please try again.'))
        setCreating(false)
      }
    } catch (error: any) {
      console.error('Error creating community:', error)
      setErrorMessage(getErrorMessage(error, 'An unexpected error occurred. Please try again.'))
      setCreating(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center max-w-md">
          <Shield size={56} className="mx-auto mb-4 text-[#58a6ff]" />
          <h2 className="text-2xl font-bold text-white mb-4">Sign in required</h2>
          <p className="text-[#666666] mb-6">You need to be signed in to create a community.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-8 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#A0A0A0] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/communities')}
            className="flex items-center gap-2 text-[#666666] hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Communities
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
            Create a Community
          </h1>
          <p className="text-[#666666]">Build your own space on CRYB</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step.number < currentStep
                        ? 'bg-green-500 text-white'
                        : step.number === currentStep
                        ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                        : 'bg-[#141414] border border-white/10 text-[#666666]'
                    }`}
                  >
                    {step.number < currentStep ? <Check size={20} /> : step.number}
                  </div>
                  <div className="text-center mt-2 hidden sm:block">
                    <div className="text-sm font-semibold text-white">{step.title}</div>
                    <div className="text-xs text-[#666666]">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step.number < currentStep ? 'bg-green-500' : 'bg-[#141414]'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6 flex items-center gap-2.5">
            <CheckCircle size={20} />
            <span>Community created successfully! Redirecting...</span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6 flex items-center gap-2.5">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Basic Information</h2>
                <p className="text-[#666666]">Let's start with the basics</p>
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white">
                  Community Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value.toLowerCase())}
                  placeholder="mycommunity"
                  className={`w-full p-3 rounded-xl text-base bg-[#0D0D0D] text-white outline-none transition-colors ${
                    errors.name ? 'border-2 border-red-500' : 'border border-white/10'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                <p className="text-[#666666] text-sm mt-1">
                  This will be your community's URL: cryb.ai/community/{formData.name || 'name'}
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="My Awesome Community"
                  className={`w-full p-3 rounded-xl text-base bg-[#0D0D0D] text-white outline-none transition-colors ${
                    errors.displayName ? 'border-2 border-red-500' : 'border border-white/10'
                  }`}
                />
                {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what your community is about..."
                  rows={4}
                  className={`w-full p-3 rounded-xl text-base resize-y bg-[#0D0D0D] text-white outline-none transition-colors ${
                    errors.description ? 'border-2 border-red-500' : 'border border-white/10'
                  }`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                <p className="text-[#666666] text-sm mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full p-3 border border-white/10 rounded-xl text-base bg-[#0D0D0D] text-white outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Appearance */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Appearance</h2>
                <p className="text-[#666666]">Customize how your community looks</p>
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white">Community Icon</label>
                <div className="flex items-center gap-4">
                  {iconPreview ? (
                    <div className="relative">
                      <img
                        src={iconPreview}
                        alt="Icon preview"
                        className="w-24 h-24 rounded-xl object-cover border border-white/10"
                      />
                      <button
                        onClick={() => handleRemoveFile('icon')}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-[#0D0D0D] border-2 border-dashed border-white/20 flex items-center justify-center">
                      <ImageIcon size={32} className="text-[#666666]" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('icon', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => iconInputRef.current?.click()}
                      className="px-4 py-2 bg-[#58a6ff] rounded-xl text-white font-semibold hover:bg-[#4a94e8] transition-all"
                    >
                      Upload Icon
                    </button>
                    <p className="text-[#666666] text-sm mt-2">
                      Recommended: Square image, at least 256x256px
                    </p>
                  </div>
                </div>
                {errors.icon && <p className="text-red-500 text-sm mt-1">{errors.icon}</p>}
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white">Community Banner</label>
                <div className="space-y-4">
                  {bannerPreview ? (
                    <div className="relative">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-48 rounded-xl object-cover border border-white/10"
                      />
                      <button
                        onClick={() => handleRemoveFile('banner')}
                        className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-xl bg-[#0D0D0D] border-2 border-dashed border-white/20 flex items-center justify-center">
                      <ImageIcon size={48} className="text-[#666666]" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('banner', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-4 py-2 bg-[#58a6ff] rounded-xl text-white font-semibold hover:bg-[#4a94e8] transition-all"
                    >
                      Upload Banner
                    </button>
                    <p className="text-[#666666] text-sm mt-2">
                      Recommended: 1920x384px or wider
                    </p>
                  </div>
                </div>
                {errors.banner && <p className="text-red-500 text-sm mt-1">{errors.banner}</p>}
              </div>

              <div>
                <label className="block font-semibold mb-2 text-white flex items-center gap-2">
                  <Palette size={18} />
                  Theme Colors
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#666666] mb-2">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#0D0D0D] border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#666666] mb-2">Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => handleInputChange('accentColor', e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.accentColor}
                        onChange={(e) => handleInputChange('accentColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#0D0D0D] border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Privacy & Type */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Privacy & Type</h2>
                <p className="text-[#666666]">Choose who can see and join your community</p>
              </div>

              <div className="space-y-3">
                <label className="block font-semibold mb-2 text-white">Privacy Level</label>
                {[
                  {
                    value: 'public',
                    icon: Globe,
                    title: 'Public',
                    description: 'Anyone can view and join this community'
                  },
                  {
                    value: 'restricted',
                    icon: Eye,
                    title: 'Restricted',
                    description: 'Anyone can view, but approval required to join'
                  },
                  {
                    value: 'private',
                    icon: Lock,
                    title: 'Private',
                    description: 'Only approved members can view and join'
                  }
                ].map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleInputChange('privacy', option.value)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        formData.privacy === option.value
                          ? 'bg-[#58a6ff]/20 border-2 border-[#58a6ff]'
                          : 'bg-[#0D0D0D] border border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon size={24} className={formData.privacy === option.value ? 'text-[#58a6ff]' : 'text-[#666666]'} />
                        <div className="flex-1">
                          <div className="font-semibold text-white mb-1">{option.title}</div>
                          <div className="text-sm text-[#666666]">{option.description}</div>
                        </div>
                        {formData.privacy === option.value && (
                          <CheckCircle size={20} className="text-[#58a6ff]" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div>
                <label className="flex items-center gap-3 p-4 bg-[#0D0D0D] border border-white/10 rounded-xl cursor-pointer hover:border-white/30 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.nsfw}
                    onChange={(e) => handleInputChange('nsfw', e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-[#58a6ff]"
                  />
                  <div>
                    <span className="font-semibold text-white block mb-1">NSFW (18+)</span>
                    <span className="text-sm text-[#666666]">
                      This community contains adult content
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Rules */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Community Rules</h2>
                <p className="text-[#666666]">Set guidelines for your community (optional)</p>
              </div>

              <div className="space-y-3">
                {formData.rules.map((rule, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-[#666666] font-semibold">
                      {index + 1}.
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => handleRuleChange(index, e.target.value)}
                        placeholder={`Rule ${index + 1}`}
                        className="w-full p-3 rounded-xl text-base bg-[#0D0D0D] border border-white/10 text-white outline-none"
                      />
                    </div>
                    {formData.rules.length > 1 && (
                      <button
                        onClick={() => removeRule(index)}
                        className="flex-shrink-0 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {errors.rules && <p className="text-red-500 text-sm">{errors.rules}</p>}

              {formData.rules.length < 10 && (
                <button
                  onClick={addRule}
                  className="w-full p-3 border-2 border-dashed border-white/20 rounded-xl text-[#666666] hover:text-white hover:border-white/40 transition-all"
                >
                  + Add Rule
                </button>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Review & Create</h2>
                <p className="text-[#666666]">Double-check everything before creating</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#0D0D0D] border border-white/10 rounded-xl">
                  <div className="text-sm text-[#666666] mb-1">Community Name</div>
                  <div className="text-white font-semibold">{formData.displayName}</div>
                  <div className="text-sm text-[#666666]">cryb.ai/community/{formData.name}</div>
                </div>

                <div className="p-4 bg-[#0D0D0D] border border-white/10 rounded-xl">
                  <div className="text-sm text-[#666666] mb-1">Description</div>
                  <div className="text-white">{formData.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0D0D0D] border border-white/10 rounded-xl">
                    <div className="text-sm text-[#666666] mb-1">Category</div>
                    <div className="text-white capitalize">{formData.category}</div>
                  </div>
                  <div className="p-4 bg-[#0D0D0D] border border-white/10 rounded-xl">
                    <div className="text-sm text-[#666666] mb-1">Privacy</div>
                    <div className="text-white capitalize">{formData.privacy}</div>
                  </div>
                </div>

                {(formData.icon || formData.banner) && (
                  <div className="p-4 bg-[#0D0D0D] border border-white/10 rounded-xl">
                    <div className="text-sm text-[#666666] mb-2">Images</div>
                    <div className="flex gap-3">
                      {iconPreview && (
                        <img src={iconPreview} alt="Icon" className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      {bannerPreview && (
                        <img src={bannerPreview} alt="Banner" className="flex-1 h-16 rounded-lg object-cover" />
                      )}
                    </div>
                  </div>
                )}

                {formData.rules.filter((r) => r.trim()).length > 0 && (
                  <div className="p-4 bg-[#0D0D0D] border border-white/10 rounded-xl">
                    <div className="text-sm text-[#666666] mb-2">Rules</div>
                    <ol className="space-y-1">
                      {formData.rules
                        .filter((r) => r.trim())
                        .map((rule, index) => (
                          <li key={index} className="text-white text-sm">
                            {index + 1}. {rule}
                          </li>
                        ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                currentStep === 1
                  ? 'bg-[#0D0D0D] border border-white/10 text-[#666666] cursor-not-allowed'
                  : 'bg-[#0D0D0D] border border-white/10 text-white hover:bg-white/5'
              }`}
            >
              <ArrowLeft size={18} />
              Back
            </button>

            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl text-white font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all"
              >
                Next
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={creating || success}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  creating || success
                    ? 'bg-[#0D0D0D] border border-white/10 text-[#666666] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:shadow-[0_0_20px_rgba(88,166,255,0.4)]'
                }`}
              >
                {creating ? (
                  <>
                    <Loader className="" size={18} />
                    Create
                  </>
                ) : success ? (
                  <>
                    <CheckCircle size={18} />
                    Created!
                  </>
                ) : (
                  <>
                    Create Community
                    <Check size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCommunityPage
