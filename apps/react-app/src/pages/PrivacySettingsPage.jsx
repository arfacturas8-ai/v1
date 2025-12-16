import React, { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, Users, Globe, Lock, Bell, MessageSquare } from 'lucide-react'

const PrivacySettingsPage = () => {
  const [settings, setSettings] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowDirectMessages: 'everyone',
    showActivity: true,
    dataCollection: false,
    personalization: true
  })

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Privacy settings page">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: "48px", height: "48px", flexShrink: 0, background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)' }}>
                <Shield style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} />
              </div>
              <h1 style={{color: "var(--text-primary)"}} className="text-xl sm:text-2xl font-bold ">Privacy Settings</h1>
            </div>
            <p className="text-sm sm:text-base text-[#666666]">Control who can see your information and how your data is used</p>
          </div>

          {/* Profile Visibility */}
          <div className="rounded-2xl  p-4 sm:p-6 mb-3 sm:mb-4" style={{ background: 'rgba(20, 20, 20, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Globe style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              <h2 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-semibold ">Profile Visibility</h2>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {['public', 'friends', 'private'].map(option => (
                <label key={option} className="flex items-center gap-3 p-2 sm:p-3 rounded-lg cursor-pointer" style={{ background: settings.profileVisibility === option ? 'rgba(88, 166, 255, 0.1)' : 'transparent', border: settings.profileVisibility === option ? '1px solid rgba(88, 166, 255, 0.3)' : '1px solid transparent' }}>
                  <input type="radio" name="visibility" checked={settings.profileVisibility === option} onChange={() => updateSetting('profileVisibility', option)} className="sr-only" />
                  <div style={{ width: "24px", height: "24px", flexShrink: 0, borderColor: settings.profileVisibility === option ? '#58a6ff' : '#666666', background: settings.profileVisibility === option ? '#58a6ff' : 'transparent' }} />
                  <span style={{color: "var(--text-primary)"}} className="text-sm sm:text-base  capitalize">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="rounded-2xl  p-4 sm:p-6 mb-3 sm:mb-4" style={{ background: 'rgba(20, 20, 20, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}>
            <h2 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-semibold  mb-3 sm:mb-4">Activity & Status</h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                { key: 'showOnlineStatus', icon: Eye, label: 'Show Online Status', desc: 'Let others see when you are online' },
                { key: 'showActivity', icon: Bell, label: 'Show Activity Status', desc: 'Display your recent activity to friends' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: '#1A1A1A' }}>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <item.icon style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    <div className="min-w-0">
                      <p style={{color: "var(--text-primary)"}} className="text-sm sm:text-base  font-medium">{item.label}</p>
                      <p className="text-xs sm:text-sm text-[#666666]">{item.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => updateSetting(item.key, !settings[item.key])} className="w-12 h-6 rounded-full transition-colors flex-shrink-0" style={{ background: settings[item.key] ? '#58a6ff' : '#1A1A1A', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: "24px", height: "24px", flexShrink: 0, transform: settings[item.key] ? 'translateX(26px)' : 'translateX(2px)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div className="rounded-2xl  p-4 sm:p-6" style={{ background: 'rgba(20, 20, 20, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <MessageSquare style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              <h2 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-semibold ">Direct Messages</h2>
            </div>
            <p className="text-sm sm:text-base text-[#666666] mb-3 sm:mb-4">Control who can send you direct messages</p>
            <select value={settings.allowDirectMessages} onChange={(e) => updateSetting('allowDirectMessages', e.target.value)} className="w-full p-2 sm:p-3 rounded-lg text-sm sm:text-base  outline-none" style={{ color: "var(--text-primary)", background: '#1A1A1A', border: '1px solid var(--border-subtle)' }}>
              <option value="everyone">Everyone</option>
              <option value="friends">Friends Only</option>
              <option value="none">No One</option>
            </select>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(PrivacySettingsPage)

