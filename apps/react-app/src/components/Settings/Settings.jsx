import React, { useState, useEffect } from 'react'
import {
  User, Bell, Shield, Palette, Globe, Key,
  CreditCard, Archive, HelpCircle,
  ChevronRight, Sun, Moon, Monitor, Volume2,
  Mic, Video, LogOut, Trash2,
  Eye, EyeOff, Check, X, AlertCircle, Lock
} from 'lucide-react'

export default function Settings({ user, onClose, onLogout, theme, setTheme }) {
  const [activeSection, setActiveSection] = useState('account')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  
  const [settings, setSettings] = useState({
    account: {
      email: user?.email || 'demo@cryb.ai',
      username: user?.username || 'DemoUser',
      displayName: user?.displayName || 'Demo User',
      bio: user?.bio || '',
      twoFactorEnabled: false,
      emailVerified: true
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      directMessages: true,
      mentions: true,
      replies: true,
      newFollowers: false,
      communityInvites: true,
      promotions: false
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowDirectMessages: 'everyone',
      showActivity: true,
      allowIndexing: true,
      dataCollection: false
    },
    appearance: {
      theme: theme || 'dark',
      fontSize: 'medium',
      compactMode: false,
      animations: true,
      colorBlindMode: false,
      highContrast: false
    },
    audio: {
      inputDevice: 'default',
      outputDevice: 'default',
      inputVolume: 80,
      outputVolume: 100,
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      pushToTalk: false,
      pushToTalkKey: 'Space'
    },
    keybinds: {
      toggleMute: 'Ctrl+M',
      toggleDeafen: 'Ctrl+D',
      toggleVideo: 'Ctrl+Shift+V',
      openSettings: 'Ctrl+,',
      quickSwitcher: 'Ctrl+K'
    }
  })

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to load from API first
        const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://api.cryb.ai'}/api/v1/settings`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.data) {
            setSettings(data.data)
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
      
      // Also check localStorage for cached settings
      const cachedSettings = localStorage.getItem('userSettings')
      if (cachedSettings) {
        try {
          const parsed = JSON.parse(cachedSettings)
          setSettings(prev => ({ ...prev, ...parsed }))
        } catch (e) {
          console.error('Error parsing cached settings:', e)
        }
      }
    }
    
    loadSettings()
  }, [])

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
    setUnsavedChanges(true)
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://api.cryb.ai'}/api/v1/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        setUnsavedChanges(false)
        
        // Apply theme if changed
        if (settings.appearance.theme !== theme) {
          setTheme(settings.appearance.theme)
        }
        
        // Store in localStorage as backup
        localStorage.setItem('userSettings', JSON.stringify(settings))
      } else {
        console.error('Failed to save settings:', response.status)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      // Save to localStorage as fallback
      localStorage.setItem('userSettings', JSON.stringify(settings))
      setUnsavedChanges(false)
      
      // Apply theme if changed
      if (settings.appearance.theme !== theme) {
        setTheme(settings.appearance.theme)
      }
    }
  }

  const handleReset = () => {
    // Reset to original settings
    setUnsavedChanges(false)
  }

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'audio', label: 'Voice & Audio', icon: Volume2 },
    { id: 'keybinds', label: 'Keybinds', icon: Key },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'data', label: 'Data & Storage', icon: Archive },
    { id: 'support', label: 'Support', icon: HelpCircle }
  ]

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="settings-section">
            <h2>Account Settings</h2>
            
            <div className="settings-group">
              <h3>Profile Information</h3>
              
              <div className="setting-item">
                <label>Email Address</label>
                <div className="input-group">
                  <input
                    type="email"
                    value={settings.account.email}
                    onChange={(e) => handleSettingChange('account', 'email', e.target.value)}
                  />
                  {settings.account.emailVerified && (
                    <span className="verified-badge">
                      <Check size={14} /> Verified
                    </span>
                  )}
                </div>
              </div>
              
              <div className="setting-item">
                <label>Username</label>
                <input
                  type="text"
                  value={settings.account.username}
                  onChange={(e) => handleSettingChange('account', 'username', e.target.value)}
                />
                <span className="hint">This is your unique identifier</span>
              </div>
              
              <div className="setting-item">
                <label>Display Name</label>
                <input
                  type="text"
                  value={settings.account.displayName}
                  onChange={(e) => handleSettingChange('account', 'displayName', e.target.value)}
                />
              </div>
              
              <div className="setting-item">
                <label>Bio</label>
                <textarea
                  value={settings.account.bio}
                  onChange={(e) => handleSettingChange('account', 'bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
            </div>

            <div className="settings-group">
              <h3>Security</h3>
              
              <div className="setting-item">
                <div className="setting-row">
                  <div>
                    <label>Two-Factor Authentication</label>
                    <span className="hint">Add an extra layer of security to your account</span>
                  </div>
                  <button className={`toggle ${settings.account.twoFactorEnabled ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                    {settings.account.twoFactorEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>
              </div>
              
              <div className="setting-item">
                <button className="btn-secondary">
                  <Key size={16} />
                  Change Password
                </button>
              </div>
            </div>

            <div className="settings-group danger">
              <h3>Danger Zone</h3>
              
              <div className="setting-item">
                <div className="setting-row">
                  <div>
                    <label>Delete Account</label>
                    <span className="hint">Permanently delete your account and all data</span>
                  </div>
                  <button className="btn-danger">
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="settings-section">
            <h2>Notification Settings</h2>
            
            <div className="settings-group">
              <h3>General</h3>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Email Notifications</span>
                    <span className="hint">Receive notifications via email</span>
                  </div>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Push Notifications</span>
                    <span className="hint">Receive browser push notifications</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="settings-group">
              <h3>Activity</h3>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.directMessages}
                    onChange={(e) => handleSettingChange('notifications', 'directMessages', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <span>Direct Messages</span>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.mentions}
                    onChange={(e) => handleSettingChange('notifications', 'mentions', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <span>@mentions</span>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.replies}
                    onChange={(e) => handleSettingChange('notifications', 'replies', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <span>Replies to your posts</span>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.notifications.newFollowers}
                    onChange={(e) => handleSettingChange('notifications', 'newFollowers', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <span>New followers</span>
                </label>
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="settings-section">
            <h2>Privacy & Security</h2>
            
            <div className="settings-group">
              <h3>Profile Privacy</h3>
              
              <div className="setting-item">
                <label>Profile Visibility</label>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.privacy.showOnlineStatus}
                    onChange={(e) => handleSettingChange('privacy', 'showOnlineStatus', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Show Online Status</span>
                    <span className="hint">Let others see when you're online</span>
                  </div>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.privacy.showActivity}
                    onChange={(e) => handleSettingChange('privacy', 'showActivity', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Show Activity</span>
                    <span className="hint">Display your current activity status</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="settings-group">
              <h3>Communication</h3>
              
              <div className="setting-item">
                <label>Who can send you direct messages?</label>
                <select
                  value={settings.privacy.allowDirectMessages}
                  onChange={(e) => handleSettingChange('privacy', 'allowDirectMessages', e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends Only</option>
                  <option value="none">No One</option>
                </select>
              </div>
            </div>

            <div className="settings-group">
              <h3>Data & Privacy</h3>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.privacy.allowIndexing}
                    onChange={(e) => handleSettingChange('privacy', 'allowIndexing', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Allow Search Engine Indexing</span>
                    <span className="hint">Let search engines find your profile</span>
                  </div>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.privacy.dataCollection}
                    onChange={(e) => handleSettingChange('privacy', 'dataCollection', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Analytics & Improvement</span>
                    <span className="hint">Help improve CRYB with anonymous usage data</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="settings-section">
            <h2>Appearance</h2>
            
            <div className="settings-group">
              <h3>Theme</h3>
              
              <div className="theme-selector">
                <label className={`theme-option ${settings.appearance.theme === 'light' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={settings.appearance.theme === 'light'}
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                  />
                  <Sun size={20} />
                  <span>Light</span>
                </label>
                
                <label className={`theme-option ${settings.appearance.theme === 'dark' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={settings.appearance.theme === 'dark'}
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                  />
                  <Moon size={20} />
                  <span>Dark</span>
                </label>
                
                <label className={`theme-option ${settings.appearance.theme === 'auto' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="auto"
                    checked={settings.appearance.theme === 'auto'}
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                  />
                  <Monitor size={20} />
                  <span>Auto</span>
                </label>
              </div>
            </div>

            <div className="settings-group">
              <h3>Display</h3>
              
              <div className="setting-item">
                <label>Font Size</label>
                <select
                  value={settings.appearance.fontSize}
                  onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.appearance.compactMode}
                    onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Compact Mode</span>
                    <span className="hint">Reduce spacing between elements</span>
                  </div>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.appearance.animations}
                    onChange={(e) => handleSettingChange('appearance', 'animations', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Animations</span>
                    <span className="hint">Enable UI animations and transitions</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="settings-group">
              <h3>Accessibility</h3>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.appearance.colorBlindMode}
                    onChange={(e) => handleSettingChange('appearance', 'colorBlindMode', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Color Blind Mode</span>
                    <span className="hint">Optimize colors for color blindness</span>
                  </div>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.appearance.highContrast}
                    onChange={(e) => handleSettingChange('appearance', 'highContrast', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>High Contrast</span>
                    <span className="hint">Increase contrast for better visibility</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )

      case 'audio':
        return (
          <div className="settings-section">
            <h2>Voice & Audio</h2>
            
            <div className="settings-group">
              <h3>Input Device</h3>
              
              <div className="setting-item">
                <label>Microphone</label>
                <select
                  value={settings.audio.inputDevice}
                  onChange={(e) => handleSettingChange('audio', 'inputDevice', e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="mic1">Built-in Microphone</option>
                  <option value="mic2">External Microphone</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>Input Volume</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.audio.inputVolume}
                    onChange={(e) => handleSettingChange('audio', 'inputVolume', e.target.value)}
                  />
                  <span>{settings.audio.inputVolume}%</span>
                </div>
              </div>
              
              <button className="btn-secondary">
                <Mic size={16} />
                Test Microphone
              </button>
            </div>

            <div className="settings-group">
              <h3>Output Device</h3>
              
              <div className="setting-item">
                <label>Speakers/Headphones</label>
                <select
                  value={settings.audio.outputDevice}
                  onChange={(e) => handleSettingChange('audio', 'outputDevice', e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="speakers">Speakers</option>
                  <option value="headphones">Headphones</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>Output Volume</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.audio.outputVolume}
                    onChange={(e) => handleSettingChange('audio', 'outputVolume', e.target.value)}
                  />
                  <span>{settings.audio.outputVolume}%</span>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3>Voice Processing</h3>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.audio.noiseSuppression}
                    onChange={(e) => handleSettingChange('audio', 'noiseSuppression', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Noise Suppression</span>
                    <span className="hint">Remove background noise</span>
                  </div>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.audio.echoCancellation}
                    onChange={(e) => handleSettingChange('audio', 'echoCancellation', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Echo Cancellation</span>
                    <span className="hint">Prevent audio feedback</span>
                  </div>
                </label>
              </div>
              
              <div className="setting-item">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={settings.audio.autoGainControl}
                    onChange={(e) => handleSettingChange('audio', 'autoGainControl', e.target.checked)}
                  />
                  <span className="switch"></span>
                  <div>
                    <span>Automatic Gain Control</span>
                    <span className="hint">Automatically adjust microphone levels</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )

      case 'keybinds':
        return (
          <div className="settings-section">
            <h2>Keyboard Shortcuts</h2>

            <div className="settings-group">
              <h3>Navigation</h3>

              <div className="setting-item">
                <label>Quick Switcher</label>
                <div className="keybind-input">
                  <input type="text" value={settings.keybinds.quickSwitcher} readOnly />
                  <button className="btn-secondary">Change</button>
                </div>
              </div>

              <div className="setting-item">
                <label>Open Settings</label>
                <div className="keybind-input">
                  <input type="text" value={settings.keybinds.openSettings} readOnly />
                  <button className="btn-secondary">Change</button>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3>Communication</h3>

              <div className="setting-item">
                <label>Toggle Mute</label>
                <div className="keybind-input">
                  <input type="text" value={settings.keybinds.toggleMute} readOnly />
                  <button className="btn-secondary">Change</button>
                </div>
              </div>

              <div className="setting-item">
                <label>Toggle Deafen</label>
                <div className="keybind-input">
                  <input type="text" value={settings.keybinds.toggleDeafen} readOnly />
                  <button className="btn-secondary">Change</button>
                </div>
              </div>

              <div className="setting-item">
                <label>Toggle Video</label>
                <div className="keybind-input">
                  <input type="text" value={settings.keybinds.toggleVideo} readOnly />
                  <button className="btn-secondary">Change</button>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <button className="btn-secondary">Reset to Defaults</button>
            </div>
          </div>
        )

      case 'devices':
        return (
          <div className="settings-section">
            <h2>Authorized Devices</h2>

            <div className="settings-group">
              <h3>Active Sessions</h3>
              <p className="hint">Manage devices that are currently signed into your account</p>

              <div className="device-list">
                <div className="device-item current">
                  <div className="device-icon">
                    <Monitor size={24} />
                  </div>
                  <div className="device-info">
                    <h4>Current Device</h4>
                    <p>Linux • Chrome • Last active: Now</p>
                    <p className="device-location">Location: Not available</p>
                  </div>
                  <span className="current-badge">Current</span>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <button className="btn-danger">Sign Out All Other Devices</button>
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="settings-section">
            <h2>Billing & Subscriptions</h2>

            <div className="settings-group">
              <h3>Current Plan</h3>
              <div className="plan-card">
                <div className="plan-header">
                  <h4>Free Plan</h4>
                  <span className="plan-price">$0/month</span>
                </div>
                <p>You're currently on the free plan with access to basic features</p>
              </div>
            </div>

            <div className="settings-group">
              <h3>Upgrade to Premium</h3>
              <p className="hint">Get access to exclusive features and support the platform</p>

              <div className="premium-features">
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Ad-free experience</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Custom profile themes</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Priority support</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Exclusive badges</span>
                </div>
              </div>

              <button className="btn-primary">Upgrade to Premium</button>
            </div>
          </div>
        )

      case 'data':
        return (
          <div className="settings-section">
            <h2>Data Management</h2>

            <div className="settings-group">
              <h3>Download Your Data</h3>
              <p className="hint">Request a copy of all your data in a downloadable format</p>
              <button className="btn-secondary">
                <Download size={16} />
                Request Data Export
              </button>
            </div>

            <div className="settings-group">
              <h3>Data Usage</h3>
              <div className="storage-info">
                <div className="storage-bar">
                  <div className="storage-fill" style={{width: '35%'}}></div>
                </div>
                <p>350 MB of 1 GB used</p>
              </div>
            </div>

            <div className="settings-group">
              <h3>Clear Cache</h3>
              <p className="hint">Clear temporary data to free up space</p>
              <button className="btn-secondary">Clear Cache</button>
            </div>
          </div>
        )

      case 'support':
        return (
          <div className="settings-section">
            <h2>Help & Support</h2>

            <div className="settings-group">
              <h3>Get Help</h3>
              <div className="support-links">
                <a href="/docs" className="support-link">
                  <HelpCircle size={20} />
                  <div>
                    <h4>Documentation</h4>
                    <p>Learn how to use CRYB</p>
                  </div>
                </a>
                <a href="/faq" className="support-link">
                  <HelpCircle size={20} />
                  <div>
                    <h4>FAQ</h4>
                    <p>Frequently asked questions</p>
                  </div>
                </a>
                <a href="mailto:support@cryb.ai" className="support-link">
                  <Mail size={20} />
                  <div>
                    <h4>Contact Support</h4>
                    <p>Email: support@cryb.ai</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="settings-group">
              <h3>System Information</h3>
              <div className="system-info">
                <div className="info-row">
                  <span>Version</span>
                  <span>1.0.0</span>
                </div>
                <div className="info-row">
                  <span>Platform</span>
                  <span>Web</span>
                </div>
                <div className="info-row">
                  <span>Browser</span>
                  <span>{navigator.userAgent.split(' ').slice(-1)[0]}</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="settings-section">
            <h2>{sections.find(s => s.id === activeSection)?.label}</h2>
            <p className="coming-soon">This section is coming soon!</p>
          </div>
        )
    }
  }

  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        <div className="settings-header">
          <h1>Settings</h1>
          <button className="close-settings" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="settings-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon size={18} />
              <span>{section.label}</span>
              <ChevronRight size={16} className="chevron" />
            </button>
          ))}
        </nav>
        
        <div className="settings-footer">
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
      
      <div className="settings-content">
        {renderSection()}
        
        {unsavedChanges && (
          <div className="settings-bar">
            <div className="unsaved-message">
              <AlertCircle size={16} />
              You have unsaved changes
            </div>
            <div className="settings-actions">
              <button className="btn-reset" onClick={handleReset}>
                Reset
              </button>
              <button className="btn-save" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
