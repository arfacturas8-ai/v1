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
    <div style={{background: "var(--bg-primary)"}} className="min-h-screen p-4 md:p-6 " role="main" aria-label="System settings page">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: "48px", height: "48px", flexShrink: 0 }}>
                <Settings style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} aria-hidden="true" />
              </div>
              <h1 style={{color: "var(--text-primary)"}} className="text-xl md:text-2xl font-bold ">System Settings</h1>
            </div>
            <p style={{color: "var(--text-secondary)"}} className="text-sm md:text-base ">Configure system-level preferences and performance options</p>
          </div>

          {/* Performance */}
          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 md:p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Monitor style={{ width: "24px", height: "24px", flexShrink: 0 }} aria-hidden="true" />
              <h2 style={{color: "var(--text-primary)"}} className="text-base md:text-lg font-semibold ">Performance</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'hardwareAcceleration', label: 'Hardware Acceleration', desc: 'Use GPU for rendering when available' },
                { key: 'reducedMotion', label: 'Reduced Motion', desc: 'Minimize animations and transitions' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-white">
                  <div className="flex-1 min-w-0 pr-4">
                    <p style={{color: "var(--text-primary)"}} className=" font-medium text-sm md:text-base">{item.label}</p>
                    <p style={{color: "var(--text-secondary)"}} className="text-xs md:text-sm ">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => updateSetting(item.key, !settings[item.key])}
                    style={{ borderColor: "var(--border-subtle)", background: settings[item.key] ? '#000000' : '#E8EAED' }} className="w-12 h-6 rounded-full transition-colors border  flex-shrink-0 relative"
                    aria-label={`Toggle ${item.label}`}
                    aria-pressed={settings[item.key]}
                  >
                    <div
                      style={{ width: "24px", height: "24px", flexShrink: 0, transform: settings[item.key] ? 'translateX(26px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Audio */}
          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 md:p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 style={{ width: "24px", height: "24px", flexShrink: 0 }} aria-hidden="true" />
              <h2 style={{color: "var(--text-primary)"}} className="text-base md:text-lg font-semibold ">Audio</h2>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white">
              <div className="flex-1 min-w-0 pr-4">
                <p style={{color: "var(--text-primary)"}} className=" font-medium text-sm md:text-base">Sound Effects</p>
                <p style={{color: "var(--text-secondary)"}} className="text-xs md:text-sm ">Play sounds for notifications and actions</p>
              </div>
              <button
                onClick={() => updateSetting('soundEffects', !settings.soundEffects)}
                style={{ borderColor: "var(--border-subtle)", background: settings.soundEffects ? '#000000' : '#E8EAED' }} className="w-12 h-6 rounded-full transition-colors border  flex-shrink-0 relative"
                aria-label="Toggle sound effects"
                aria-pressed={settings.soundEffects}
              >
                <div
                  style={{ width: "24px", height: "24px", flexShrink: 0, transform: settings.soundEffects ? 'translateX(26px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
          </div>

          {/* Storage */}
          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive style={{ width: "24px", height: "24px", flexShrink: 0 }} aria-hidden="true" />
              <h2 style={{color: "var(--text-primary)"}} className="text-base md:text-lg font-semibold ">Storage</h2>
            </div>
            <div className="p-4 rounded-lg mb-4 bg-white">
              <div className="flex justify-between mb-2 text-sm md:text-base">
                <span style={{color: "var(--text-secondary)"}} className="">Cache Size</span>
                <span style={{color: "var(--text-primary)"}} className="">128 MB</span>
              </div>
              <div style={{background: "var(--bg-primary)"}} className="h-2 rounded-full overflow-hidden ">
                <div className="h-full rounded-full w-[35%] bg-gradient-to-br from-[#58a6ff] to-[#a371f7]" />
              </div>
            </div>
            <button
              className="w-full p-3 rounded-lg flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/30 text-sm md:text-base"
              aria-label="Clear cache"
            >
              <Trash2 style={{ width: "24px", height: "24px", flexShrink: 0 }} aria-hidden="true" />
              Clear Cache
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(SystemSettingsPage)

