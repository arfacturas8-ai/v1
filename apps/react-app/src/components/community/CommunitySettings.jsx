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
      <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ marginBottom: 'var(--space-4)' }}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!canManageCommunity) {
    return (
      <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)', textAlign: 'center', color: 'var(--color-error)' }}>
          <AlertTriangle size={48} />
          <h3 style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Access Denied</h3>
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>You don't have permission to manage this community's settings.</p>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)', padding: 'var(--space-5)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-5)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', margin: 0, marginBottom: 'var(--space-1)', color: 'var(--text-primary)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)' }}>
              <Settings size={24} />
              Community Settings
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{community?.displayName}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            <button onClick={onClose} className="btn-ghost" style={{ padding: 'var(--space-2)', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar Tabs */}
          <div style={{ width: '200px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', overflowY: 'auto' }} className="custom-scrollbar">
            {tabs.map(tab => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    width: '100%',
                    padding: 'var(--space-3) var(--space-5)',
                    background: isActive ? 'var(--color-info-light)' : 'transparent',
                    borderRight: isActive ? '2px solid var(--brand-primary)' : 'none',
                    color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    textAlign: 'left',
                    borderRadius: 0
                  }}
                >
                  <TabIcon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }} className="custom-scrollbar">
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-error-light)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', marginBottom: 'var(--space-5)', color: 'var(--color-error-dark)', fontSize: 'var(--text-sm)' }}>
                <AlertTriangle size={16} />
                {typeof error === 'string' ? error : getErrorMessage(error, 'An error occurred')}
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div>
                <h3 style={{ margin: 0, marginBottom: 'var(--space-6)', color: 'var(--text-primary)', fontSize: 'var(--text-lg)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}>General Settings</h3>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Community Name</label>
                  <input
                    type="text"
                    value={getCurrentValue('displayName')}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="Community display name"
                    className="input"
                  />
                  <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
                    This is how your community appears to members and visitors
                  </p>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Description</label>
                  <textarea
                    value={getCurrentValue('description')}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what your community is about..."
                    rows={4}
                    className="input textarea"
                  />
                  <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
                    Help people understand what your community is about
                  </p>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Category</label>
                  <select
                    value={getCurrentValue('category')}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="input"
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

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Community Rules</label>
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
                <h3 style={{ margin: 0, marginBottom: 'var(--space-6)', color: 'var(--text-primary)', fontSize: 'var(--text-lg)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}>Privacy & Access</h3>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Community Type</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <label className="card card-compact" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', transition: 'all var(--transition-normal)' }}>
                      <input
                        type="radio"
                        name="communityType"
                        value="public"
                        checked={getCurrentValue('isPublic') === true}
                        onChange={() => handleInputChange('isPublic', true)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      <Globe size={20} style={{ color: 'var(--brand-primary)' }} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>Public</strong>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>Anyone can view and join this community</p>
                      </div>
                    </label>

                    <label className="card card-compact" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', transition: 'all var(--transition-normal)' }}>
                      <input
                        type="radio"
                        name="communityType"
                        value="private"
                        checked={getCurrentValue('isPublic') === false}
                        onChange={() => handleInputChange('isPublic', false)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      <Lock size={20} style={{ color: 'var(--brand-primary)' }} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>Private</strong>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>Only invited members can view and participate</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={getCurrentValue('requireApproval')}
                      onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Require approval for new members
                  </label>
                  <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
                    New member requests will need to be approved by moderators
                  </p>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={getCurrentValue('allowPosts')}
                      onChange={(e) => handleInputChange('allowPosts', e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Allow members to create posts
                  </label>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={getCurrentValue('showInDirectory')}
                      onChange={(e) => handleInputChange('showInDirectory', e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Show in community directory
                  </label>
                  <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
                    Allow this community to appear in search results and recommendations
                  </p>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div>
                <h3 style={{ margin: 0, marginBottom: 'var(--space-6)', color: 'var(--text-primary)', fontSize: 'var(--text-lg)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}>Appearance & Branding</h3>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Community Icon</label>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                    <div className="avatar avatar-lg">
                      <img
                        src={community?.icon || '/default-community.png'}
                        alt="Community icon"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="btn btn-primary btn-sm" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                        <Upload size={16} />
                        Upload New Icon
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('icon', e.target.files[0])}
                          hidden
                        />
                      </label>
                      <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
                        Recommended: 256x256px, PNG or JPG
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Banner Image</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ width: '100%', height: '120px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img
                        src={community?.banner || '/default-banner.png'}
                        alt="Community banner"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <label className="btn btn-primary btn-sm" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                        <Upload size={16} />
                        Upload New Banner
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('banner', e.target.files[0])}
                          hidden
                        />
                      </label>
                      <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
                        Recommended: 1920x300px, PNG or JPG
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Theme Color</label>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={getCurrentValue('themeColor') || '#58a6ff'}
                      onChange={(e) => handleInputChange('themeColor', e.target.value)}
                      style={{ width: '50px', height: '40px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={getCurrentValue('themeColor') || '#58a6ff'}
                      onChange={(e) => handleInputChange('themeColor', e.target.value)}
                      placeholder="#58a6ff"
                      className="input"
                      style={{ width: '120px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
                    Choose a primary color for your community's theme
                  </p>
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div>
                <h3 style={{ margin: 0, marginBottom: 'var(--space-6)', color: 'var(--text-primary)', fontSize: 'var(--text-lg)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}>Member Permissions</h3>

                <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
                  <h4 style={{ margin: 0, marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>Post Permissions</h4>
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'createPosts')}
                        onChange={(e) => handleNestedChange('permissions', 'createPosts', e.target.checked)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      Members can create posts
                    </label>
                  </div>

                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'uploadMedia')}
                        onChange={(e) => handleNestedChange('permissions', 'uploadMedia', e.target.checked)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      Members can upload images and media
                    </label>
                  </div>

                  <div style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'createPolls')}
                        onChange={(e) => handleNestedChange('permissions', 'createPolls', e.target.checked)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      Members can create polls
                    </label>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
                  <h4 style={{ margin: 0, marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>Community Permissions</h4>
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'inviteMembers')}
                        onChange={(e) => handleNestedChange('permissions', 'inviteMembers', e.target.checked)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      Members can invite others
                    </label>
                  </div>

                  <div style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={getNestedValue('permissions', 'createEvents')}
                        onChange={(e) => handleNestedChange('permissions', 'createEvents', e.target.checked)}
                        style={{ width: 'auto', margin: 0 }}
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
                <h3 style={{ margin: 0, marginBottom: 'var(--space-6)', color: 'var(--text-primary)', fontSize: 'var(--text-lg)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}>Moderation Settings</h3>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={getNestedValue('moderation', 'autoModeratePosts')}
                      onChange={(e) => handleNestedChange('moderation', 'autoModeratePosts', e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Auto-moderate new posts
                  </label>
                  <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
                    Posts from new members will require approval before being visible
                  </p>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={getNestedValue('moderation', 'filterProfanity')}
                      onChange={(e) => handleNestedChange('moderation', 'filterProfanity', e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Filter profanity
                  </label>
                  <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
                    Automatically detect and filter inappropriate language
                  </p>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={getNestedValue('moderation', 'requireEmailVerification')}
                      onChange={(e) => handleNestedChange('moderation', 'requireEmailVerification', e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Require email verification for new members
                  </label>
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>Minimum account age (days)</label>
                  <input
                    type="number"
                    min="0"
                    value={getNestedValue('moderation', 'minAccountAge')}
                    onChange={(e) => handleNestedChange('moderation', 'minAccountAge', parseInt(e.target.value) || 0)}
                    className="input"
                  />
                  <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {rules.map((rule, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--brand-primary)', color: 'var(--text-inverse)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', flexShrink: 0 }}>
            {index + 1}
          </div>
          <input
            type="text"
            value={rule}
            onChange={(e) => updateRule(index, e.target.value)}
            placeholder="Enter a community rule..."
            className="input"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <button
            type="button"
            onClick={() => removeRule(index)}
            style={{ background: 'var(--color-error)', color: 'var(--text-inverse)', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-normal)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-error-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-error)'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRule}
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--bg-secondary)', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all var(--transition-normal)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--brand-primary)'
          e.currentTarget.style.color = 'var(--brand-primary)'
          e.currentTarget.style.background = 'var(--color-info-light)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-default)'
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.background = 'var(--bg-secondary)'
        }}
      >
        <Plus size={16} />
        Add Rule
      </button>
    </div>
  )
}
