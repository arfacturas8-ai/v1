import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react'

const AppearanceSettingsPage = () => {
  const [theme, setTheme] = useState('dark')
  const [accentColor, setAccentColor] = useState('#58a6ff')

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor }
  ]

  const colors = ['#58a6ff', '#a371f7', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

  return (
    <div
      role="main"
      aria-label="Appearance settings page"
      style={{
        minHeight: '100vh',
        padding: '16px',
        background: '#FAFAFA'
      }}
    >
      <div style={{ maxWidth: '768px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Palette style={{ width: "24px", height: "24px", flexShrink: 0, color: '#1A1A1A' }} />
            <h1 style={{ color: '#1A1A1A', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              Appearance
            </h1>
          </div>
          <p style={{ color: '#666666', fontSize: '15px', margin: 0 }}>
            Customize how the app looks and feels
          </p>
        </motion.div>

        {/* Theme Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            background: '#FFFFFF',
            border: '1px solid #E8EAED',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <h2 style={{ color: '#1A1A1A', fontSize: '17px', fontWeight: '600', marginBottom: '16px' }}>
            Theme
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: theme === t.id ? 'rgba(88, 166, 255, 0.1)' : '#FAFAFA',
                  border: theme === t.id ? '2px solid #58a6ff' : '2px solid #E8EAED'
                }}
              >
                <t.icon style={{ width: "24px", height: "24px", flexShrink: 0, color: theme === t.id ? '#58a6ff' : '#666666' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: theme === t.id ? '#1A1A1A' : '#666666' }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Accent Color */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            borderRadius: '16px',
            padding: '20px',
            background: '#FFFFFF',
            border: '1px solid #E8EAED',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <h2 style={{ color: '#1A1A1A', fontSize: '17px', fontWeight: '600', marginBottom: '16px' }}>
            Accent Color
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setAccentColor(color)}
                style={{
                  width: "48px",
                  height: "48px",
                  flexShrink: 0,
                  borderRadius: '12px',
                  background: color,
                  border: accentColor === color ? '3px solid #1A1A1A' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {accentColor === color && <Check style={{ color: "#FFFFFF", width: "24px", height: "24px", flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(AppearanceSettingsPage)

