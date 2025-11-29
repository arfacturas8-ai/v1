import React, { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Monitor, Volume2, Download, Trash2, HardDrive, RefreshCw } from 'lucide-react'

const SystemSettingsPage = () => {
  const [settings, setSettings] = useState({
    hardwareAcceleration: true,
    autoUpdate: true,
    soundEffects: true,
    reducedMotion: false
  })

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[#0d1117]" role="main" aria-label="System settings page">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center bg-gradient-to-br from-[#58a6ff] to-[#a371f7]">
                <Settings className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white">System Settings</h1>
            </div>
            <p className="text-sm md:text-base text-[#8b949e]">Configure system-level preferences and performance options</p>
          </div>

          {/* Performance */}
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="w-5 h-5 text-[#58a6ff]" aria-hidden="true" />
              <h2 className="text-base md:text-lg font-semibold text-white">Performance</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'hardwareAcceleration', label: 'Hardware Acceleration', desc: 'Use GPU for rendering when available' },
                { key: 'reducedMotion', label: 'Reduced Motion', desc: 'Minimize animations and transitions' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-[#21262d]">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-white font-medium text-sm md:text-base">{item.label}</p>
                    <p className="text-xs md:text-sm text-[#8b949e]">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => updateSetting(item.key, !settings[item.key])}
                    className="w-12 h-6 rounded-full transition-colors border border-white/10 flex-shrink-0 relative"
                    style={{ background: settings[item.key] ? '#58a6ff' : '#21262d' }}
                    aria-label={`Toggle ${item.label}`}
                    aria-pressed={settings[item.key]}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5"
                      style={{ transform: settings[item.key] ? 'translateX(26px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Audio */}
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-[#a371f7]" aria-hidden="true" />
              <h2 className="text-base md:text-lg font-semibold text-white">Audio</h2>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#21262d]">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-white font-medium text-sm md:text-base">Sound Effects</p>
                <p className="text-xs md:text-sm text-[#8b949e]">Play sounds for notifications and actions</p>
              </div>
              <button
                onClick={() => updateSetting('soundEffects', !settings.soundEffects)}
                className="w-12 h-6 rounded-full transition-colors border border-white/10 flex-shrink-0 relative"
                style={{ background: settings.soundEffects ? '#58a6ff' : '#21262d' }}
                aria-label="Toggle sound effects"
                aria-pressed={settings.soundEffects}
              >
                <div
                  className="w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5"
                  style={{ transform: settings.soundEffects ? 'translateX(26px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </div>

          {/* Storage */}
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="w-5 h-5 text-emerald-500" aria-hidden="true" />
              <h2 className="text-base md:text-lg font-semibold text-white">Storage</h2>
            </div>
            <div className="p-4 rounded-lg mb-4 bg-[#21262d]">
              <div className="flex justify-between mb-2 text-sm md:text-base">
                <span className="text-[#8b949e]">Cache Size</span>
                <span className="text-white">128 MB</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[#0d1117]">
                <div className="h-full rounded-full w-[35%] bg-gradient-to-br from-[#58a6ff] to-[#a371f7]" />
              </div>
            </div>
            <button
              className="w-full p-3 rounded-lg flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/30 text-sm md:text-base"
              aria-label="Clear cache"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Clear Cache
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(SystemSettingsPage)

