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
      className="min-h-screen p-4 sm:p-6"
      style={{ background: '#0d1117' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-6 h-6 sm:w-7 sm:h-7 text-[#58a6ff]" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white m-0">
              Appearance
            </h1>
          </div>
          <p className="text-[#8b949e] text-sm sm:text-base m-0">
            Customize how the app looks and feels
          </p>
        </motion.div>

        {/* Theme Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 mb-4 sm:mb-6"
          style={{
            background: 'rgba(22, 27, 34, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
            Theme
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="p-3 sm:p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer transition-all duration-200 flex flex-col items-center gap-2"
                style={{
                  background: theme === t.id ? 'rgba(88, 166, 255, 0.2)' : '#21262d',
                  border: theme === t.id ? '2px solid #58a6ff' : '2px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <t.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme === t.id ? '#58a6ff' : '#8b949e' }} />
                <span className="text-xs sm:text-sm font-medium" style={{ color: theme === t.id ? '#ffffff' : '#c9d1d9' }}>
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
          className="rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6"
          style={{
            background: 'rgba(22, 27, 34, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
            Accent Color
          </h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setAccentColor(color)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer flex items-center justify-center transition-all duration-200"
                style={{
                  background: color,
                  border: accentColor === color ? '3px solid #ffffff' : '3px solid transparent'
                }}
              >
                {accentColor === color && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(AppearanceSettingsPage)

