import React, { useState, useRef, useEffect } from 'react'
import { X, Upload, Trash2, Users, Settings, Shield, Image as ImageIcon } from 'lucide-react'
import { Button, Input } from '../ui'
import serverService from '../../services/serverService'
import { useResponsive } from '../../hooks/useResponsive'

function ServerSettingsModal({ server, onClose, onUpdate }) {
  const { isMobile, isTablet } = useResponsive()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: server?.name || '',
    description: server?.description || '',
    isPublic: server?.isPublic ?? true,
    icon: null,
    banner: null
  })

  const [iconPreview, setIconPreview] = useState(server?.icon || null)
  const [bannerPreview, setBannerPreview] = useState(server?.banner || null)

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
    setError('')
    setSuccess('')
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError(`${type} must be less than 5MB`)
      return
    }

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

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Server name is required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await serverService.updateServer(server.id, formData)

      if (result.success) {
        setSuccess('Server updated successfully')
        onUpdate(result.server)

        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Failed to update server')
      }
    } catch (err) {
      console.error('Failed to update server:', err)
      setError('Failed to update server')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${server.name}"? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await serverService.deleteServer(server.id)

      if (result.success) {
        onUpdate(null) // Signal deletion
        onClose()
      } else {
        setError(result.error || 'Failed to delete server')
      }
    } catch (err) {
      console.error('Failed to delete server:', err)
      setError('Failed to delete server')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
    { id: 'moderation', label: 'Moderation', icon: <Shield className="w-4 h-4" /> }
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md sm:max-w-lg md:max-w-4xl bg-[rgba(22,27,34,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,82,255,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/10">
          <h2 className="font-bold text-lg sm:text-xl text-white">
            Server Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Sidebar - horizontal on mobile, vertical on desktop */}
          <div className="md:w-48 border-b md:border-b-0 md:border-r border-white/10 bg-white/5">
            <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible p-2 sm:p-4 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 md:flex-shrink md:w-full flex items-center justify-center md:justify-start gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition-colors min-h-[44px] whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white'
                      : 'hover:bg-white/10 text-tertiary'
                  }`}
                >
                  {tab.icon}
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto">
            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 sm:p-4 bg-error/10 border border-error/30 rounded-xl text-error text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 sm:p-4 bg-success/10 border border-success/30 rounded-xl text-success text-sm">
                {success}
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Server Name
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={200}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Server Icon
                  </label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => iconInputRef.current?.click()}
                    >
                      {iconPreview ? (
                        <img src={iconPreview} alt="Server icon" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-tertiary" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => iconInputRef.current?.click()}
                      className="min-h-[44px]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="text-sm">Change Icon</span>
                    </Button>
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'icon')}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Server Banner
                  </label>
                  <div
                    className="w-full h-24 sm:h-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Server banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-tertiary" />
                        <p className="text-xs sm:text-sm text-secondary">
                          Click to upload banner
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'banner')}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-white/20"
                    />
                    <span className="text-sm sm:text-base font-medium text-white">
                      Public Server
                    </span>
                  </label>
                  <p className="text-xs sm:text-sm text-secondary mt-1 ml-6 sm:ml-7">
                    Anyone can find and join this server
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-base sm:text-lg font-bold text-error mb-3">
                    Danger Zone
                  </h3>
                  <div className="p-3 sm:p-4 border border-error/30 rounded-xl bg-error/5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="text-sm sm:text-base font-medium text-white mb-1">
                          Delete Server
                        </p>
                        <p className="text-xs sm:text-sm text-error">
                          Once deleted, this server cannot be recovered
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDelete}
                        loading={loading}
                        className="w-full sm:w-auto min-h-[44px] flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span className="text-sm">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Server Members ({server.members?.length || 0})
                </h3>

                {server.members && server.members.length > 0 ? (
                  <div className="space-y-2">
                    {server.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {member.user.avatar ? (
                            <img
                              src={member.user.avatar}
                              alt={member.user.username}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center font-semibold text-white text-sm flex-shrink-0">
                              {member.user.displayName?.[0]?.toUpperCase() || member.user.username[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-medium text-white truncate">
                              {member.user.displayName || member.user.username}
                            </p>
                            <p className="text-xs sm:text-sm text-secondary truncate">
                              @{member.user.username}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <span className="px-2 py-1 rounded-lg bg-white/10 text-xs font-medium hidden sm:inline-block">
                            {member.role}
                          </span>
                          {member.role !== 'OWNER' && (
                            <button
                              className="px-3 py-2 rounded-lg text-xs sm:text-sm text-error hover:bg-error/10 transition-colors min-h-[44px] min-w-[44px] sm:min-w-0"
                              onClick={async () => {
                                if (confirm(`Remove ${member.user.username} from the server?`)) {
                                  setLoading(true)
                                  try {
                                    const result = await serverService.kickMember(server.id, member.id, 'Removed from server')
                                    if (result.success) {
                                      setSuccess(`${member.user.username} has been removed`)
                                      // Refresh server data
                                      setTimeout(() => window.location.reload(), 1500)
                                    } else {
                                      setError(result.error || 'Failed to remove member')
                                    }
                                  } catch (err) {
                                    setError('Failed to remove member')
                                  } finally {
                                    setLoading(false)
                                  }
                                }
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-secondary">
                    No members found
                  </p>
                )}

                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm sm:text-base font-semibold text-white mb-2">
                    Invite Members
                  </h4>
                  <p className="text-xs sm:text-sm text-secondary mb-3">
                    Share this server's invite link or ID with others to join
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      value={server.id}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(server.id)
                        setSuccess('Server ID copied to clipboard!')
                        setTimeout(() => setSuccess(''), 2000)
                      }}
                      className="w-full sm:w-auto min-h-[44px]"
                    >
                      <span className="text-sm">Copy ID</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Moderation Tab */}
            {activeTab === 'moderation' && (
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Moderation Tools
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  {/* Auto-Moderation */}
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-white mb-2">
                      Auto-Moderation
                    </h4>
                    <p className="text-xs sm:text-sm text-secondary mb-3">
                      Automatically moderate content based on rules
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm sm:text-base font-medium text-white">Profanity Filter</p>
                          <p className="text-xs sm:text-sm text-secondary">Block messages containing profanity</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5 rounded flex-shrink-0" />
                      </label>
                      <label className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm sm:text-base font-medium text-white">Spam Detection</p>
                          <p className="text-xs sm:text-sm text-secondary">Automatically detect and remove spam</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5 rounded flex-shrink-0" />
                      </label>
                      <label className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm sm:text-base font-medium text-white">Link Filtering</p>
                          <p className="text-xs sm:text-sm text-secondary">Restrict external links</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5 rounded flex-shrink-0" />
                      </label>
                    </div>
                  </div>

                  {/* Banned Words */}
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-white mb-2">
                      Banned Words
                    </h4>
                    <p className="text-xs sm:text-sm text-secondary mb-3">
                      Add words to automatically filter from messages
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        placeholder="Enter word to ban..."
                        className="flex-1"
                      />
                      <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
                        <span className="text-sm">Add Word</span>
                      </Button>
                    </div>
                    <p className="text-xs text-tertiary mt-2">
                      No banned words configured yet
                    </p>
                  </div>

                  {/* Slow Mode */}
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-white mb-2">
                      Slow Mode
                    </h4>
                    <p className="text-xs sm:text-sm text-secondary mb-3">
                      Limit how often members can send messages
                    </p>
                    <select className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent-cyan/50">
                      <option value="0">Off</option>
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSuccess('Moderation settings saved!')
                        setTimeout(() => setSuccess(''), 2000)
                      }}
                      className="w-full sm:w-auto min-h-[44px]"
                    >
                      <span className="text-sm">Save Moderation Settings</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-white/10">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <span className="text-sm">Cancel</span>
            </Button>
            {activeTab === 'general' && (
              <Button
                onClick={handleSave}
                loading={loading}
                className="w-full sm:w-auto min-h-[44px]"
              >
                <span className="text-sm">Save Changes</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}




export default ServerSettingsModal
