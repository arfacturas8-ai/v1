import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wallet, Check, AlertCircle, ExternalLink, Shield, Zap } from 'lucide-react'

const WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Most popular Ethereum wallet',
    icon: '🦊',
    color: '#f6851b'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Connect with mobile wallets',
    icon: '🔗',
    color: '#58a6ff'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Secure and easy to use',
    icon: '🔵',
    color: '#0052ff'
  },
  {
    id: 'phantom',
    name: 'Phantom',
    description: 'Solana & Ethereum support',
    icon: '👻',
    color: '#ab9ff2'
  }
]

export default function WalletConnectionPage() {
  const navigate = useNavigate()
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')
  const [connectedAddress, setConnectedAddress] = useState('')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0])
        }
      }
    } catch (err) {
      console.error('Check connection error:', err)
    }
  }

  const connectWallet = async (walletId) => {
    setSelectedWallet(walletId)
    setIsConnecting(true)
    setError('')

    try {
      if (walletId === 'metamask') {
        if (!window.ethereum) {
          setError('MetaMask is not installed. Please install it from metamask.io')
          setIsConnecting(false)
          return
        }

        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })

        if (accounts.length > 0) {
          setConnectedAddress(accounts[0])

          // Send connection to backend
          await fetch('/api/wallet/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              address: accounts[0],
              walletType: walletId
            }),
          })

          setTimeout(() => {
            navigate('/crypto')
          }, 1500)
        }
      } else {
        // Simulate connection for other wallets
        setTimeout(() => {
          setError(`${WALLETS.find(w => w.id === walletId)?.name} connection is not yet implemented`)
          setIsConnecting(false)
        }, 1000)
      }
    } catch (err) {
      console.error('Wallet connection error:', err)
      setError(err.message || 'Failed to connect wallet')
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      await fetch('/api/wallet/disconnect', {
        method: 'POST',
        credentials: 'include'
      })
      setConnectedAddress('')
      setSelectedWallet(null)
    } catch (err) {
      console.error('Disconnect error:', err)
    }
  }

  if (connectedAddress && !isConnecting) {
  return (
    <div role="main" aria-label="Wallet connected page" className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4 md:p-5">
        <div className="w-full max-w-md bg-[#141414]/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-emerald-500/15 rounded-full mb-6 md:mb-8" aria-hidden="true">
            <Check size={40} className="md:w-12 md:h-12 text-emerald-500" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">
            Wallet Connected!
          </h1>

          <div className="bg-[#1A1A1A]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-6 mb-6 md:mb-8 border border-white/10">
            <div className="text-sm text-[#666666] mb-2 font-medium">
              Connected Address
            </div>
            <div className="text-sm font-mono text-[#A0A0A0] font-semibold break-all">
              {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/crypto"
              className="block py-3.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-xl text-base font-semibold shadow-lg shadow-[#58a6ff]/40 hover:opacity-90 transition-opacity"
            >
              Go to Crypto Dashboard
            </Link>

            <button
              onClick={disconnectWallet}
              className="py-3 bg-[#1A1A1A]/60 text-[#666666] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-sm font-semibold hover:bg-[#30363d]/80 transition-colors"
              aria-label="Disconnect wallet"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div role="main" aria-label="Wallet connection page" className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4 md:p-5">
      <div className="w-full max-w-2xl bg-[#141414]/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-[#58a6ff]/15 rounded-full mb-4 md:mb-6" aria-hidden="true">
            <Wallet size={32} className="md:w-10 md:h-10 text-[#58a6ff]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-3">
            Connect Your Wallet
          </h1>
          <p className="text-base md:text-lg text-[#666666] leading-relaxed">
            Choose a wallet to connect to Cryb.ai
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8" role="group" aria-label="Wallet connection features">
          {[
            { icon: Shield, label: 'Secure' },
            { icon: Zap, label: 'Fast' },
            { icon: Check, label: 'Simple' }
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-2 p-3 bg-[#1A1A1A]/60 rounded-lg border border-white/10"
              >
                <Icon size={20} className="text-[#58a6ff]" aria-hidden="true" />
                <span className="text-xs md:text-sm font-semibold text-[#A0A0A0]">
                  {feature.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Wallets */}
        <div className="flex flex-col gap-3 mb-6" role="group" aria-label="Available wallets">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => connectWallet(wallet.id)}
              disabled={isConnecting}
              className="flex items-center gap-4 p-4 md:p-5 rounded-xl transition-all text-left w-full border-2 disabled:cursor-not-allowed hover:enabled:shadow-lg"
              style={{
                background: selectedWallet === wallet.id && isConnecting ? `${wallet.color}15` : 'rgba(33, 38, 45, 0.6)',
                borderColor: selectedWallet === wallet.id && isConnecting ? wallet.color : 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseOver={(e) => {
                if (!isConnecting) {
                  e.currentTarget.style.borderColor = wallet.color
                  e.currentTarget.style.background = `${wallet.color}15`
                }
              }}
              onMouseOut={(e) => {
                if (!(selectedWallet === wallet.id && isConnecting)) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.background = 'rgba(33, 38, 45, 0.6)'
                }
              }}
              aria-label={`Connect with ${wallet.name}`}
              aria-busy={selectedWallet === wallet.id && isConnecting}
            >
              <div className="text-4xl w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]" style={{ background: `${wallet.color}15` }} aria-hidden="true">
                {wallet.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base md:text-lg font-semibold text-white mb-1">
                  {wallet.name}
                </div>
                <div className="text-sm text-[#666666] truncate">
                  {wallet.description}
                </div>
              </div>
              {selectedWallet === wallet.id && isConnecting && (
                <div className="w-6 h-6 rounded-full border-3 " style={{ borderColor: `${wallet.color}30`, borderTopColor: wallet.color }} role="status" aria-label="Connecting..." />
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6" role="alert" aria-live="assertive">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-red-400 leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="bg-[#1A1A1A]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 mb-6 border border-white/10">
          <p className="text-xs md:text-sm text-[#666666] leading-relaxed">
            By connecting your wallet, you agree to our{' '}
            <Link to="/terms" className="text-[#58a6ff] underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#58a6ff] underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 text-center">
          <p className="text-sm text-[#666666] mb-3">
            Don't have a wallet?
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#58a6ff] text-sm font-semibold hover:underline"
            aria-label="Get MetaMask wallet (opens in new tab)"
          >
            Get MetaMask
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}


