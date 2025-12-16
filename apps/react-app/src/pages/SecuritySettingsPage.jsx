import React, { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Key, Smartphone, Lock, AlertTriangle, Check, ChevronRight, Fingerprint } from 'lucide-react'
import { Link } from 'react-router-dom'

const SecuritySettingsPage = () => {
  const [twoFactor, setTwoFactor] = useState(false)

  const securityItems = [
    { icon: Key, label: 'Change Password', desc: 'Update your account password', link: '/settings/password' },
    { icon: Fingerprint, label: 'Passkeys', desc: 'Set up passwordless authentication', link: '/passkey-setup' },
    { icon: Smartphone, label: 'Two-Factor Authentication', desc: twoFactor ? 'Enabled' : 'Not enabled', toggle: true },
    { icon: Lock, label: 'Active Sessions', desc: 'Manage devices logged into your account', link: '/settings/sessions' }
  ]

  return (
    <div style={{background: "var(--bg-primary)"}} className="min-h-screen p-4 md:p-6 " role="main" aria-label="Security settings page">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: "48px", height: "48px", flexShrink: 0 }}>
                <Shield style={{color: "var(--text-primary)"}} style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              </div>
              <h1 style={{color: "var(--text-primary)"}} className="text-xl md:text-2xl font-bold ">Security Settings</h1>
            </div>
            <p style={{color: "var(--text-secondary)"}} className="text-sm md:text-base ">Protect your account with additional security features</p>
          </div>

          {/* Security Status */}
          <div className={`rounded-2xl  p-4 md:p-6 mb-6 ${twoFactor ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
            <div className="flex items-center gap-3">
              {twoFactor ? <Check className="w-5 md:w-6 h-5 md:h-6 text-emerald-500" /> : <AlertTriangle className="w-5 md:w-6 h-5 md:h-6 text-amber-500" />}
              <div>
                <p style={{color: "var(--text-primary)"}} className="text-sm md:text-base  font-medium">{twoFactor ? 'Your account is well protected' : 'Security can be improved'}</p>
                <p style={{color: "var(--text-secondary)"}} className="text-xs md:text-sm ">{twoFactor ? 'Two-factor authentication is enabled' : 'Enable two-factor authentication for better security'}</p>
              </div>
            </div>
          </div>

          {/* Security Options */}
          <div style={{borderColor: "var(--border-subtle)"}} className="card rounded-2xl  overflow-hidden   border ">
            {securityItems.map((item, idx) => (
              <div key={item.label}>
                {item.toggle ? (
                  <div className="card flex items-center justify-between p-3 md:p-4 hover:  transition-colors">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-9 md:w-10 h-9 md:h-10 rounded-lg flex items-center justify-center bg-[#21262d]">
                        <item.icon className="w-4 md:w-5 h-4 md:h-5 text-[#58a6ff]" />
                      </div>
                      <div>
                        <p style={{color: "var(--text-primary)"}} className="text-sm md:text-base  font-medium">{item.label}</p>
                        <p style={{color: "var(--text-secondary)"}} className="text-xs md:text-sm ">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTwoFactor(!twoFactor)}
                      className={`relative w-11 md:w-12 h-5 md:h-6 rounded-full transition-colors border border-white/10 ${twoFactor ? 'bg-[#58a6ff]' : 'bg-[#21262d]'}`}
                      aria-label={`Toggle two-factor authentication ${twoFactor ? 'off' : 'on'}`}
                    >
                      <div className={`w-4 md:w-5 h-4 md:h-5 rounded-full bg-white transition-transform ${twoFactor ? 'translate-x-6 md:translate-x-[26px]' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ) : (
                  <Link to={item.link} className="card flex items-center justify-between p-3 md:p-4 hover:  transition-colors no-underline">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-9 md:w-10 h-9 md:h-10 rounded-lg flex items-center justify-center bg-[#21262d]">
                        <item.icon className="w-4 md:w-5 h-4 md:h-5 text-[#58a6ff]" />
                      </div>
                      <div>
                        <p style={{color: "var(--text-primary)"}} className="text-sm md:text-base  font-medium">{item.label}</p>
                        <p style={{color: "var(--text-secondary)"}} className="text-xs md:text-sm ">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight style={{color: "var(--text-secondary)"}} className="w-4 md:w-5 h-4 md:h-5 " />
                  </Link>
                )}
                {idx < securityItems.length - 1 && <div className="card h-px  " />}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(SecuritySettingsPage)

