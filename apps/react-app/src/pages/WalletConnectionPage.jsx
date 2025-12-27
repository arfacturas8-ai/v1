/**
 * WalletConnectionPage Component
 * Displays wallet connection options with iOS aesthetic
 * Features: MetaMask, WalletConnect, Coinbase Wallet, Phantom integration
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wallet, Check, AlertCircle, ExternalLink, Shield, Zap } from 'lucide-react'
import apiService from '../services/api'

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
    color: '#000000'
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
    color: '#000000'
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

          try {
            await apiService.post('/wallet/connect', {
              address: accounts[0],
              walletType: walletId
            })

            setTimeout(() => {
              navigate('/crypto')
            }, 1500)
          } catch (apiError) {
            console.error('Failed to save wallet connection:', apiError)
            setError('Failed to save wallet connection. Please try again.')
            setIsConnecting(false)
            return
          }
        }
      } else {
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
          background: '#FAFAFA',
          padding: '24px'
        }}
      >
        <div style={{
          maxWidth: '448px',
          width: '100%',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px'
            }}
            aria-hidden="true"
          >
            <Check size={40} style={{ color: '#10B981' }} />
          </div>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#000000',
              marginBottom: '16px'
            }}
          >
            Wallet Connected!
          </h1>

          <div
            style={{
              background: '#F9FAFB',
              marginBottom: '32px',
              borderRadius: '16px',
              padding: '20px'
            }}
          >
            <div
              style={{
                fontSize: '14px',
                color: '#666666',
                marginBottom: '8px',
                fontWeight: '500'
              }}
            >
              Connected Address
            </div>
            <div
              style={{
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#000000',
                fontWeight: '600',
                wordBreak: 'break-all'
              }}
            >
              {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              to="/wallet"
              style={{
                display: 'block',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Go to Wallet
            </Link>

            <button
              onClick={disconnectWallet}
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                color: '#666666',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
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
        background: '#FAFAFA',
        padding: '24px'
      }}
    >
      <div style={{
        maxWidth: '672px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}
            aria-hidden="true"
          >
            <Wallet size={32} style={{ color: '#000000' }} />
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#000000',
              marginBottom: '12px'
            }}
          >
            Connect Your Wallet
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#666666',
              lineHeight: '1.6'
            }}
          >
            Choose a wallet to connect to Cryb.ai
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '32px'
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
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <Icon size={20} style={{ color: '#000000' }} aria-hidden="true" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#666666' }}>
                  {feature.label}
                </span>
              </div>
            )
          })}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '24px'
          }}
          role="group"
          aria-label="Available wallets"
        >
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => connectWallet(wallet.id)}
              disabled={isConnecting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'left',
                width: '100%',
                background: selectedWallet === wallet.id && isConnecting ? '#F9FAFB' : '#FFFFFF',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                opacity: isConnecting && selectedWallet !== wallet.id ? 0.5 : 1,
                borderRadius: '16px',
                padding: '20px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => !isConnecting && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              aria-label={`Connect with ${wallet.name}`}
              aria-busy={selectedWallet === wallet.id && isConnecting}
            >
              <div
                style={{
                  fontSize: '36px',
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  background: '#F9FAFB'
                }}
                aria-hidden="true"
              >
                {wallet.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '4px'
                  }}
                >
                  {wallet.name}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#666666',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {wallet.description}
                </div>
              </div>
              {selectedWallet === wallet.id && isConnecting && (
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #E5E7EB',
                  borderTopColor: '#000000',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} role="status" aria-label="Connecting..." />
              )}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #EF4444',
              borderRadius: '16px',
              marginBottom: '24px'
            }}
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle size={20} style={{ color: '#EF4444', flexShrink: 0 }} aria-hidden="true" />
            <p style={{ fontSize: '14px', color: '#DC2626', lineHeight: '1.6' }}>
              {typeof error === 'string' ? error : 'An error occurred'}
            </p>
          </div>
        )}

        <div
          style={{
            background: '#F9FAFB',
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '16px'
          }}
        >
          <p style={{ fontSize: '14px', color: '#666666', lineHeight: '1.6' }}>
            By connecting your wallet, you agree to our{' '}
            <Link to="/terms" style={{ color: '#000000', textDecoration: 'underline' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" style={{ color: '#000000', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div
          style={{
            paddingTop: '24px',
            borderTop: '1px solid #E5E7EB',
            textAlign: 'center'
          }}
        >
          <p style={{ fontSize: '14px', color: '#666666', marginBottom: '12px' }}>
            Don't have a wallet?
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#000000',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
            aria-label="Get MetaMask wallet (opens in new tab)"
          >
            Get MetaMask
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
