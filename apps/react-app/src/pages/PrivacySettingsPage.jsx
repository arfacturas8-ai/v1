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
    <div style={{ minHeight: '100vh', padding: '16px', background: '#FAFAFA' }} role="main" aria-label="Privacy settings page">
      <div style={{ maxWidth: '896px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: "48px", height: "48px", flexShrink: 0, borderRadius: '12px', background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield style={{ color: "#FFFFFF", width: "24px", height: "24px", flexShrink: 0 }} />
              </div>
              <h1 style={{ color: '#1A1A1A', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Privacy Settings</h1>
            </div>
            <p style={{ fontSize: '15px', color: '#666666', margin: 0 }}>Control who can see your information and how your data is used</p>
          </div>

          {/* Profile Visibility */}
          <div style={{ borderRadius: '16px', padding: '20px', marginBottom: '16px', background: '#FFFFFF', border: '1px solid #E8EAED', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Globe style={{ width: "24px", height: "24px", flexShrink: 0, color: '#1A1A1A' }} />
              <h2 style={{ color: '#1A1A1A', fontSize: '17px', fontWeight: '600', margin: 0 }}>Profile Visibility</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['public', 'friends', 'private'].map(option => (
                <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer', background: settings.profileVisibility === option ? 'rgba(88, 166, 255, 0.1)' : '#FAFAFA', border: settings.profileVisibility === option ? '2px solid #000000' : '2px solid #E8EAED', transition: 'all 0.2s' }}>
                  <input type="radio" name="visibility" checked={settings.profileVisibility === option} onChange={() => updateSetting('profileVisibility', option)} style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }} />
                  <div style={{ width: "20px", height: "20px", flexShrink: 0, borderRadius: '50%', border: `2px solid ${settings.profileVisibility === option ? '#000000' : '#CCCCCC'}`, background: settings.profileVisibility === option ? '#000000' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {settings.profileVisibility === option && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF' }} />}
                  </div>
                  <span style={{ color: '#1A1A1A', fontSize: '15px', fontWeight: '500', textTransform: 'capitalize' }}>{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Toggle Settings */}
          <div style={{ borderRadius: '16px', padding: '20px', marginBottom: '16px', background: '#FFFFFF', border: '1px solid #E8EAED', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h2 style={{ color: '#1A1A1A', fontSize: '17px', fontWeight: '600', marginBottom: '16px' }}>Activity & Status</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { key: 'showOnlineStatus', icon: Eye, label: 'Show Online Status', desc: 'Let others see when you are online' },
                { key: 'showActivity', icon: Bell, label: 'Show Activity Status', desc: 'Display your recent activity to friends' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px', borderRadius: '12px', background: '#FAFAFA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <item.icon style={{ width: "24px", height: "24px", flexShrink: 0, color: '#666666' }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: '#1A1A1A', fontSize: '15px', fontWeight: '500', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: '13px', color: '#666666', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => updateSetting(item.key, !settings[item.key])} style={{ width: '48px', height: '28px', borderRadius: '14px', transition: 'all 0.2s', flexShrink: 0, background: settings[item.key] ? '#000000' : '#CCCCCC', border: 'none', cursor: 'pointer', position: 'relative', padding: 0 }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', position: 'absolute', top: '2px', left: settings[item.key] ? '22px' : '2px', transition: 'left 0.2s' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div style={{ borderRadius: '16px', padding: '20px', background: '#FFFFFF', border: '1px solid #E8EAED', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <MessageSquare style={{ width: "24px", height: "24px", flexShrink: 0, color: '#1A1A1A' }} />
              <h2 style={{ color: '#1A1A1A', fontSize: '17px', fontWeight: '600', margin: 0 }}>Direct Messages</h2>
            </div>
            <p style={{ fontSize: '15px', color: '#666666', marginBottom: '16px' }}>Control who can send you direct messages</p>
            <select value={settings.allowDirectMessages} onChange={(e) => updateSetting('allowDirectMessages', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '15px', outline: 'none', color: '#1A1A1A', background: '#FAFAFA', border: '1px solid #E8EAED', cursor: 'pointer' }}>
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

