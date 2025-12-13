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
    color: 'var(--brand-primary)'
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
    color: 'var(--brand-secondary)'
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
      <div
        role="main"
        aria-label="Wallet connected page"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          padding: 'var(--space-4)'
        }}
      >
        <div className="card" style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
          <div
            style={{
              width: '5rem',
              height: '5rem',
              background: 'var(--color-success-light)',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-8)'
            }}
            aria-hidden="true"
          >
            <Check size={40} style={{ color: 'var(--color-success)' }} />
          </div>

          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-4)'
            }}
          >
            Wallet Connected!
          </h1>

          <div
            className="card-compact"
            style={{
              background: 'var(--bg-tertiary)',
              marginBottom: 'var(--space-8)'
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-2)',
                fontWeight: 'var(--font-medium)'
              }}
            >
              Connected Address
            </div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-semibold)',
                wordBreak: 'break-all'
              }}
            >
              {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link
              to="/crypto"
              className="btn btn-primary"
              style={{
                display: 'block',
                textDecoration: 'none'
              }}
            >
              Go to Crypto Dashboard
            </Link>

            <button
              onClick={disconnectWallet}
              className="btn btn-ghost"
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
    <div
      role="main"
      aria-label="Wallet connection page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: 'var(--space-4)'
      }}
    >
      <div className="card" style={{ maxWidth: '42rem', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <div
            style={{
              width: '5rem',
              height: '5rem',
              background: 'var(--color-info-light)',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-6)'
            }}
            aria-hidden="true"
          >
            <Wallet size={32} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)'
            }}
          >
            Connect Your Wallet
          </h1>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-relaxed)'
            }}
          >
            Choose a wallet to connect to Cryb.ai
          </p>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-8)'
          }}
          role="group"
          aria-label="Wallet connection features"
        >
          {[
            { icon: Shield, label: 'Secure' },
            { icon: Zap, label: 'Fast' },
            { icon: Check, label: 'Simple' }
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="card-compact"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}
              >
                <Icon size={20} style={{ color: 'var(--brand-primary)' }} aria-hidden="true" />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)' }}>
                  {feature.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Wallets */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)'
          }}
          role="group"
          aria-label="Available wallets"
        >
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => connectWallet(wallet.id)}
              disabled={isConnecting}
              className="card card-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                textAlign: 'left',
                width: '100%',
                background: selectedWallet === wallet.id && isConnecting
                  ? 'var(--bg-hover)'
                  : 'var(--bg-secondary)',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                opacity: isConnecting && selectedWallet !== wallet.id ? 0.5 : 1
              }}
              aria-label={`Connect with ${wallet.name}`}
              aria-busy={selectedWallet === wallet.id && isConnecting}
            >
              <div
                style={{
                  fontSize: '2.25rem',
                  width: '3.5rem',
                  height: '3.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-tertiary)'
                }}
                aria-hidden="true"
              >
                {wallet.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-1)'
                  }}
                >
                  {wallet.name}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {wallet.description}
                </div>
              </div>
              {selectedWallet === wallet.id && isConnecting && (
                <div className="spinner" style={{ width: '24px', height: '24px' }} role="status" aria-label="Connecting..." />
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              background: 'var(--color-error-light)',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-xl)',
              marginBottom: 'var(--space-6)'
            }}
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle size={20} style={{ color: 'var(--color-error)', flexShrink: 0 }} aria-hidden="true" />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error-dark)', lineHeight: 'var(--leading-relaxed)' }}>
              {typeof error === 'string' ? error : 'An error occurred'}
            </p>
          </div>
        )}

        {/* Info */}
        <div
          className="card-compact"
          style={{
            background: 'var(--bg-tertiary)',
            marginBottom: 'var(--space-6)'
          }}
        >
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            By connecting your wallet, you agree to our{' '}
            <Link to="/terms" style={{ color: 'var(--brand-primary)', textDecoration: 'underline' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" style={{ color: 'var(--brand-primary)', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}
        >
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
            Don't have a wallet?
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--brand-primary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              textDecoration: 'none'
            }}
            aria-label="Get MetaMask wallet (opens in new tab)"
          >
            Get MetaMask
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}
