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
    <div className="min-h-screen p-4 md:p-6 bg-[#0d1117]" role="main" aria-label="Wallet settings page">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center bg-gradient-to-br from-[#58a6ff] to-[#a371f7]">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Wallet Settings</h1>
            </div>
            <p className="text-sm md:text-base text-[#8b949e]">Manage your connected wallets and preferences</p>
          </div>

          {/* Connected Wallets */}
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-base md:text-lg font-semibold text-white">Connected Wallets</h2>
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 transition-opacity">
                <span className="flex items-center justify-center gap-2"><Link2 className="w-4 h-4" /> Connect Wallet</span>
              </button>
            </div>
            <div className="space-y-3">
              {wallets.map(wallet => (
                <div key={wallet.id} className="flex items-center justify-between p-3 md:p-4 bg-[#21262d] rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#58a6ff]/10 flex-shrink-0">
                      <Wallet className="w-5 h-5 text-[#58a6ff]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm md:text-base text-white font-medium">{wallet.type}</span>
                        {wallet.primary && <span className="px-2 py-0.5 text-xs rounded-full bg-[#58a6ff]/20 text-[#58a6ff]">Primary</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-[#8b949e]">
                        <span className="truncate">{wallet.address}</span>
                        <button onClick={() => copyAddress(wallet.address)} className="hover:text-white transition-colors flex-shrink-0">
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-[#161b22]/60 backdrop-blur-xl transition-colors text-red-400 flex-shrink-0">
                    <Unlink className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base md:text-lg font-semibold text-white">Security</h2>
            </div>
            <p className="text-sm md:text-base text-[#8b949e] mb-4">Your wallet connections are encrypted and secured. We never store your private keys.</p>
            <a href="https://docs.example.com/wallet-security" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm md:text-base text-[#58a6ff] hover:text-[#3d9df0] transition-colors">
              Learn more about wallet security <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default memo(WalletSettingsPage)

