import React, { useState, useEffect } from 'react'
import {
  Settings, Info, Shield, Palette, Users,
  Globe, Lock, Eye, Image, Upload, X,
  Save, AlertTriangle, Plus, Trash2
} from 'lucide-react'
import communityService from '../../services/communityService'
import { getErrorMessage } from '../../utils/errorUtils'

export default function CommunitySettings({ 
  communityId, 
  currentUser, 
  canManageCommunity = false,
  onClose 
}) {
  const [activeTab, setActiveTab] = useState('general')
  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [changes, setChanges] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const tabs = [
    { id: 'general', label: 'General', icon: Info },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'permissions', label: 'Permissions', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: AlertTriangle }
  ]

  useEffect(() => {
    loadCommunity()
  }, [communityId])

  useEffect(() => {
    setHasUnsavedChanges(Object.keys(changes).length > 0)
  }, [changes])

  const loadCommunity = async () => {
    try {
      setLoading(true)
      const result = await communityService.getCommunity(communityId)
      
      if (result.success) {
        setCommunity(result.community)
      } else {
        setError(getErrorMessage(result.error, 'Failed to load community settings'))
      }
    } catch (error) {
      console.error('Failed to load community:', error)
      setError('Failed to load community settings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setChanges(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (parent, field, value) => {
    setChanges(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }))
  }

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) return
    
    try {
      setSaving(true)
      setError(null)
      
      const result = await communityService.updateCommunity(communityId, changes)
      
      if (result.success) {
        setCommunity(result.community)
        setChanges({})
        setHasUnsavedChanges(false)
      } else {
        setError(getErrorMessage(result.error, 'Failed to save changes'))
      }
    } catch (error) {
      console.error('Failed to save changes:', error)
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (type, file) => {
    if (!file) return
    
    try {
      const formData = new FormData()
      formData.append(type, file)
      
      const result = await communityService.updateCommunity(communityId, formData)
      
      if (result.success) {
        setCommunity(result.community)
      } else {
        setError(getErrorMessage(result.error, 'Failed to upload image'))
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      setError('Failed to upload image')
    }
  }

  const getCurrentValue = (field) => {
    if (field in changes) {
      return changes[field]
    }
    return community?.[field] || ''
  }

  const getNestedValue = (parent, field) => {
    if (changes[parent] && field in changes[parent]) {
      return changes[parent][field]
    }
    return community?.[parent]?.[field] || ''
  }

  if (loading) {
    return (
      <div className="bg-background-primary p-4">
        <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
          <div className="w-8 h-8 border-3 border-border-primary border-t-accent-primary rounded-full  mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!canManageCommunity) {
    return (
      <div className="bg-background-primary p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center text-error">
          <AlertTriangle size={48} />
          <h3 className="mt-4 mb-2 text-text-primary">Access Denied</h3>
          <p className="mb-4 text-text-secondary">You don't have permission to manage this community's settings.</p>
          <button onClick={onClose} className="bg-accent-primary text-white px-4 py-2 rounded-md font-medium hover:bg-accent-dark transition-colors">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-5">
      <div className="bg-card rounded-xl w-full max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border-primary bg-background-secondary">
          <div>
            <h2 className="flex items-center gap-2 m-0 mb-1 text-text-primary text-xl font-semibold">
              <Settings size={24} />
              Community Settings
            </h2>
            <p className="m-0 text-text-secondary text-sm">{community?.displayName}</p>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex items-center gap-1.5 bg-accent-primary text-white border-none rounded-lg px-4 py-2 cursor-pointer font-medium transition-all hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            <button onClick={onClose} className="bg-transparent border-none text-text-secondary cursor-pointer p-2 rounded-lg transition-all hover:bg-hover hover:text-text-primary">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[200px] bg-background-secondary border-r border-border-primary py-4 overflow-y-auto">
            {tabs.map(tab => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 w-full px-5 py-3 bg-transparent border-none text-text-secondary cursor-pointer text-sm text-left transition-all hover:bg-hover hover:text-text-primary ${activeTab === tab.id ? 'bg-accent-primary/10 text-accent-primary border-r-2 border-accent-primary' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <TabIcon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 bg-error/10 border border-error/30 rounded-lg p-3 mb-5 text-error-dark text-sm">
                <AlertTriangle size={16} />
                {typeof error === 'string' ? error : getErrorMessage(error, 'An error occurred')}
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div>
                <h3 className="m-0 mb-6 text-text-primary text-lg pb-2 border-b border-border-primary">General Settings</h3>

                <div className="mb-6">
                  <label className="block mb-2 text-text-primary font-medium text-sm">Community Name</label>
                  <input
                    type="text"
                    value={getCurrentValue('displayName')}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="Community display name"
                    className="w-full bg-input border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm transition-all focus:outline-none focus:border-accent-primary focus:ring-3 focus:ring-accent-primary/10"
                  />
                  <p className="mt-2 text-text-tertiary text-xs leading-snug">
                    This is how your community appears to members and visitors
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 text-text-primary font-medium text-sm">Description</label>
                  <textarea
                    value={getCurrentValue('description')}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what your community is about..."
                    rows={4}
                    className="w-full bg-input border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm transition-all resize-y min-h-[80px] focus:outline-none focus:border-accent-primary focus:ring-3 focus:ring-accent-primary/10"
                  />
                  <p className="mt-2 text-text-tertiary text-xs leading-snug">
                    Help people understand what your community is about
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 text-text-primary font-medium text-sm">Category</label>
                  <select
                    value={getCurrentValue('category')}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full bg-input border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm transition-all focus:outline-none focus:border-accent-primary focus:ring-3 focus:ring-accent-primary/10"
                  >
                    <option value="general">General</option>
                    <option value="gaming">Gaming</option>
                    <option value="technology">Technology</option>
                    <option value="art">Art & Design</option>
                    <option value="music">Music</option>
                    <option value="education">Education</option>
                    <option value="sports">Sports</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="business">Business</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 text-text-primary font-medium text-sm">Community Rules</label>
                  <CommunityRules
                    rules={getCurrentValue('rules') || []}
                    onChange={(rules) => handleInputChange('rules', rules)}
                  />
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div>
                <h3 className="m-0 mb-6 text-text-primary text-lg pb-2 border-b border-border-primary">Privacy & Access</h3>

                <div className="mb-6">
                  <label className="block mb-2 text-text-primary font-medium text-sm">Community Type</label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 p-4 border border-border-primary rounded-lg cursor-pointer transition-all hover:border-accent-primary/30 hover:bg-accent-primary/5">
                      <input
                        type="radio"
                        name="communityType"
                        value="public"
                        checked={getCurrentValue('isPublic') === true}
                        onChange={() => handleInputChange('isPublic', true)}
                        className="w-auto m-0"
                      />
                      <Globe size={20} />
                      <div className="flex-1">
                        <strong className="block text-text-primary mb-1">Public</strong>
                        <p className="m-0 text-text-secondary text-[13px]">Anyone can view and join this community</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-border-primary rounded-lg cursor-pointer transition-all hover:border-accent-primary/30 hover:bg-accent-primary/5">
                      <input
                        type="radio"
                        name="communityType"
                        value="private"
                        checked={getCurrentValue('isPublic') === false}
                        onChange={() => handleInputChange('isPublic', false)}
                        className="w-auto m-0"
                      />
                      <Lock size={20} />
                      <div className="flex-1">
                        <strong className="block text-text-primary mb-1">Private</strong>
                        <p className="m-0 text-text-secondary text-[13px]">Only invited members can view and participate</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={getCurrentValue('requireApproval')}
                      onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                      className="w-auto m-0"
                    />
                    Require approval for new members
                  </label>
                  <p className="mt-2 text-text-tertiary text-xs leading-snug">
                    New member requests will need to be approved by moderators
                  </p>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={getCurrentValue('allowPosts')}
                      onChange={(e) => handleInputChange('allowPosts', e.target.checked)}
                      className="w-auto m-0"
                    />
                    Allow members to create posts
                  </label>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={getCurrentValue('showInDirectory')}
                      onChange={(e) => handleInputChange('showInDirectory', e.target.checked)}
                      className="w-auto m-0"
                    />
                    Show in community directory
                  </label>
                  <p className="mt-2 text-text-tertiary text-xs leading-snug">
                    Allow this community to appear in search results and recommendations
                  </p>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div>
                <h3 className="m-0 mb-6 text-text-primary text-lg pb-2 border-b border-border-primary">Appearance & Branding</h3>

                <div className="mb-6">
                  <label className="block mb-2 text-text-primary font-medium text-sm">Community Icon</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-border-primary flex-shrink-0">
                      <img
                        src={community?.icon || '/default-community.png'}
                        alt="Community icon"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center gap-1.5 bg-accent-primary text-white border-none rounded-md px-4 py-2 cursor-pointer text-[13px] font-medium transition-all hover:bg-accent-dark">
                        <Upload size={16} />
                        Upload New Icon
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('icon', e.target.files[0])}
                          hidden
                        />
                      </label>
                      <p className="mt-2 text-text-tertiary text-xs leading-snug">
                        Recommended: 256x256px, PNG or JPG
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 text-text-primary font-medium text-sm">Banner Image</label>
                  <div className="flex flex-col items-stretch gap-4">
                    <div className="w-full h-[120px] rounded-lg overflow-hidden border border-border-primary flex-shrink-0">
                      <img
                        src={community?.banner || '/default-banner.png'}
                        alt="Community banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center gap-1.5 bg-accent-primary text-white border-none rounded-md px-4 py-2 cursor-pointer text-[13px] font-medium transition-all hover:bg-accent-dark">
                        <Upload size={16} />
                        Upload New Banner
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('banner', e.target.files[0])}
                          hidden
                        />
                      </label>
                      <p className="mt-2 text-text-tertiary text-xs leading-snug">
                        Recommended: 1920x300px, PNG or JPG
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 text-text-primary font-medium text-sm">Theme Color</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={getCurrentValue('themeColor') || '#0ea5e9'}
                      onChange={(e) => handleInputChange('themeColor', e.target.value)}
                      className="w-[50px] h-10 border border-border-primary rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={getCurrentValue('themeColor') || '#0ea5e9'}
                      onChange={(e) => handleInputChange('themeColor', e.target.value)}
                      placeholder="#0ea5e9"
                      className="w-[120px] font-mono bg-input border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm transition-all focus:outline-none focus:border-accent-primary focus:ring-3 focus:ring-accent-primary/10"
                    />
                  </div>
                  <p className="mt-2 text-text-tertiary text-xs leading-snug">
                    Choose a primary color for your community's theme
                  </p>
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div>
                <h3 className="m-0 mb-6 text-text-primary text-lg pb-2 border-b border-border-primary">Member Permissions</h3>

                <div className="mb-8 p-4 bg-background-secondary rounded-lg">
                  <h4 className="m-0 mb-4 text-text-primary text-base">Post Permissions</h4>
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'createPosts')}
                        onChange={(e) => handleNestedChange('permissions', 'createPosts', e.target.checked)}
                        className="w-auto m-0"
                      />
                      Members can create posts
                    </label>
                  </div>

                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'uploadMedia')}
                        onChange={(e) => handleNestedChange('permissions', 'uploadMedia', e.target.checked)}
                        className="w-auto m-0"
                      />
                      Members can upload images and media
                    </label>
                  </div>

                  <div className="mb-0">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'createPolls')}
                        onChange={(e) => handleNestedChange('permissions', 'createPolls', e.target.checked)}
                        className="w-auto m-0"
                      />
                      Members can create polls
                    </label>
                  </div>
                </div>

                <div className="mb-8 p-4 bg-background-secondary rounded-lg">
                  <h4 className="m-0 mb-4 text-text-primary text-base">Community Permissions</h4>
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'inviteMembers')}
                        onChange={(e) => handleNestedChange('permissions', 'inviteMembers', e.target.checked)}
                        className="w-auto m-0"
                      />
                      Members can invite others
                    </label>
                  </div>

                  <div className="mb-0">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'createEvents')}
                        onChange={(e) => handleNestedChange('permissions', 'createEvents', e.target.checked)}
                        className="w-auto m-0"
                      />
                      Members can create events
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Moderation Tab */}
            {activeTab === 'moderation' && (
              <div>
                <h3 className="m-0 mb-6 text-text-primary text-lg pb-2 border-b border-border-primary">Moderation Settings</h3>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={getNestedValue('moderation', 'autoModeratePosts')}
                      onChange={(e) => handleNestedChange('moderation', 'autoModeratePosts', e.target.checked)}
                      className="w-auto m-0"
                    />
                    Auto-moderate new posts
                  </label>
                  <p className="mt-2 text-text-tertiary text-xs leading-snug">
                    Posts from new members will require approval before being visible
                  </p>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={getNestedValue('moderation', 'filterProfanity')}
                      onChange={(e) => handleNestedChange('moderation', 'filterProfanity', e.target.checked)}
                      className="w-auto m-0"
                    />
                    Filter profanity
                  </label>
                  <p className="mt-2 text-text-tertiary text-xs leading-snug">
                    Automatically detect and filter inappropriate language
                  </p>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={getNestedValue('moderation', 'requireEmailVerification')}
                      onChange={(e) => handleNestedChange('moderation', 'requireEmailVerification', e.target.checked)}
                      className="w-auto m-0"
                    />
                    Require email verification for new members
                  </label>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 text-text-primary font-medium text-sm">Minimum account age (days)</label>
                  <input
                    type="number"
                    min="0"
                    value={getNestedValue('moderation', 'minAccountAge')}
                    onChange={(e) => handleNestedChange('moderation', 'minAccountAge', parseInt(e.target.value) || 0)}
                    className="w-full bg-input border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm transition-all focus:outline-none focus:border-accent-primary focus:ring-3 focus:ring-accent-primary/10"
                  />
                  <p className="mt-2 text-text-tertiary text-xs leading-snug">
                    Require accounts to be this old before joining (0 = no requirement)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Community Rules Component
function CommunityRules({ rules = [], onChange }) {
  const addRule = () => {
    onChange([...rules, ''])
  }

  const updateRule = (index, value) => {
    const newRules = [...rules]
    newRules[index] = value
    onChange(newRules)
  }

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index)
    onChange(newRules)
  }

  return (
    <div className="flex flex-col gap-3">
      {rules.map((rule, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-6 h-6 bg-accent-primary text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {index + 1}.
          </div>
          <input
            type="text"
            value={rule}
            onChange={(e) => updateRule(index, e.target.value)}
            placeholder="Enter a community rule..."
            className="flex-1 mb-0 bg-input border border-border-primary rounded-lg px-3 py-2.5 text-text-primary text-sm transition-all focus:outline-none focus:border-accent-primary focus:ring-3 focus:ring-accent-primary/10"
          />
          <button
            type="button"
            onClick={() => removeRule(index)}
            className="bg-error text-white border-none rounded-md p-1.5 cursor-pointer flex items-center justify-center transition-all hover:bg-error-dark"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRule}
        className="flex items-center gap-1.5 bg-background-secondary border border-dashed border-border-primary rounded-lg p-3 text-text-secondary cursor-pointer text-sm transition-all hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/5"
      >
        <Plus size={16} />
        Add Rule
      </button>
    </div>
  )
}
