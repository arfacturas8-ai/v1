import React, { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Link2, Unlink, Shield, ExternalLink, Copy, Check } from 'lucide-react'

const WalletSettingsPage = () => {
  const [copied, setCopied] = useState(false)
  const [wallets] = useState([
    { id: 1, type: 'MetaMask', address: '0x1234...5678', connected: true, primary: true },
    { id: 2, type: 'WalletConnect', address: '0xabcd...efgh', connected: true, primary: false }
  ])

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{background: "var(--bg-primary)"}} className="min-h-screen p-4 md:p-6 " role="main" aria-label="Wallet settings page">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: "48px", height: "48px", flexShrink: 0 }}>
                <Wallet style={{color: "var(--text-primary)"}} style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              </div>
              <h1 style={{color: "var(--text-primary)"}} className="text-xl md:text-2xl font-bold ">Wallet Settings</h1>
            </div>
            <p style={{color: "var(--text-secondary)"}} className="text-sm md:text-base ">Manage your connected wallets and preferences</p>
          </div>

          {/* Connected Wallets */}
          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 md:p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 style={{color: "var(--text-primary)"}} className="text-base md:text-lg font-semibold ">Connected Wallets</h2>
              <button style={{color: "var(--text-primary)"}} className="px-4 py-2 rounded-lg text-sm font-medium  bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 transition-opacity">
                <span className="flex items-center justify-center gap-2"><Link2 style={{ width: "24px", height: "24px", flexShrink: 0 }} /> Connect Wallet</span>
              </button>
            </div>
            <div className="space-y-3">
              {wallets.map(wallet => (
                <div key={wallet.id} className="flex items-center justify-between p-3 md:p-4 bg-[#21262d] rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div style={{ width: "48px", height: "48px", flexShrink: 0 }}>
                      <Wallet style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{color: "var(--text-primary)"}} className="text-sm md:text-base  font-medium">{wallet.type}</span>
                        {wallet.primary && <span className="px-2 py-0.5 text-xs rounded-full bg-[#58a6ff]/20 text-[#58a6ff]">Primary</span>}
                      </div>
                      <div style={{color: "var(--text-secondary)"}} className="flex items-center gap-2 text-xs md:text-sm ">
                        <span className="truncate">{wallet.address}</span>
                        <button onClick={() => copyAddress(wallet.address)} style={{color: "var(--text-primary)"}} className="hover: transition-colors flex-shrink-0">
                          {copied ? <Check style={{ width: "24px", height: "24px", flexShrink: 0 }} /> : <Copy style={{ width: "24px", height: "24px", flexShrink: 0 }} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button className="card p-2 rounded-lg hover:  transition-colors text-red-400 flex-shrink-0">
                    <Unlink style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              <h2 style={{color: "var(--text-primary)"}} className="text-base md:text-lg font-semibold ">Security</h2>
            </div>
            <p style={{color: "var(--text-secondary)"}} className="text-sm md:text-base  mb-4">Your wallet connections are encrypted and secured. We never store your private keys.</p>
            <a href="https://docs.example.com/wallet-security" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm md:text-base text-[#58a6ff] hover:text-[#3d9df0] transition-colors">
              Learn more about wallet security <ExternalLink style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(WalletSettingsPage)

