import React, { useState } from 'react'
import { useWeb3 } from '../Web3Provider'
import { useResponsive } from '../hooks/useResponsive'
import { getErrorMessage } from '../../utils/errorUtils'

const WalletModal = ({ isOpen, onClose }) => {
  const { isMobile, isTablet } = useResponsive()
  const {
    connectMetaMask,
    connectWalletConnect,
    connectCoinbaseWallet,
    isConnecting,
    error,
    clearError,
    WALLET_TYPES
  } = useWeb3()

  const [selectedWallet, setSelectedWallet] = useState(null)

  const walletOptions = [
    {
      id: WALLET_TYPES.METAMASK,
      name: 'MetaMask',
      description: 'Connect using MetaMask wallet',
      icon: '🦊',
      connect: connectMetaMask,
      installed: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask
    },
    {
      id: WALLET_TYPES.WALLET_CONNECT,
      name: 'WalletConnect',
      description: 'Connect using WalletConnect protocol',
      icon: '📱',
      connect: connectWalletConnect,
      installed: true
    },
    {
      id: WALLET_TYPES.COINBASE_WALLET,
      name: 'Coinbase Wallet',
      description: 'Connect using Coinbase Wallet',
      icon: '🔵',
      connect: connectCoinbaseWallet,
      installed: true
    },
    {
      id: WALLET_TYPES.RAINBOW,
      name: 'Rainbow',
      description: 'Connect using Rainbow wallet',
      icon: '🌈',
      connect: connectWalletConnect, // Would use Rainbow-specific connection
      installed: true
    }
  ]

  const handleWalletConnect = async (walletOption) => {
    setSelectedWallet(walletOption.id)
    clearError()

    try {
      const success = await walletOption.connect()
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
    } finally {
      setSelectedWallet(null)
    }
  }

  const handleInstallWallet = (walletId) => {
    const installUrls = {
      [WALLET_TYPES.METAMASK]: 'https://metamask.io/download/',
      [WALLET_TYPES.COINBASE_WALLET]: 'https://wallet.coinbase.com/',
      [WALLET_TYPES.RAINBOW]: 'https://rainbow.me/'
    }

    if (installUrls[walletId]) {
      window.open(installUrls[walletId], '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        zIndex: 'var(--z-modal)',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        className="card card-elevated"
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? '500px' : '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: isMobile ? 'var(--space-4)' : 'var(--space-6)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          paddingBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? 'var(--text-lg)' : 'var(--text-xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--space-1)'
            }}>
              Connect Wallet
            </h2>
            <p style={{
              margin: 0,
              fontSize: isMobile ? 'var(--text-sm)' : 'var(--text-base)',
              color: 'var(--text-secondary)'
            }}>
              Connect your wallet to access Web3 features
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{
              fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)',
              padding: 'var(--space-1)',
              borderRadius: 'var(--radius-lg)',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--color-error-light)',
            color: 'var(--color-error-dark)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-error)',
            marginBottom: 'var(--space-4)',
            fontSize: isMobile ? 'var(--text-sm)' : 'var(--text-base)'
          }}>
            {typeof error === "string" ? error : getErrorMessage(error, "")}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {walletOptions.map((wallet) => (
            <div
              key={wallet.id}
              className={`card ${selectedWallet === wallet.id ? 'card-interactive' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--space-4)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                border: selectedWallet === wallet.id
                  ? '2px solid var(--brand-primary)'
                  : '1px solid var(--border-subtle)',
                background: selectedWallet === wallet.id
                  ? 'var(--color-info-light)'
                  : 'var(--bg-secondary)',
                transform: selectedWallet === wallet.id ? 'translateY(-2px)' : 'none'
              }}
              onClick={() => wallet.installed ? handleWalletConnect(wallet) : handleInstallWallet(wallet.id)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--text-2xl)',
                flexShrink: 0
              }}>
                {wallet.icon}
              </div>

              <div style={{
                flex: '1',
                marginLeft: 'var(--space-4)',
                minWidth: 0
              }}>
                <div style={{
                  fontSize: isMobile ? 'var(--text-sm)' : 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {wallet.name}
                </div>
                <div style={{
                  fontSize: isMobile ? 'var(--text-xs)' : 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {wallet.description}
                </div>
              </div>

              {!wallet.installed ? (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: 'var(--text-sm)',
                    minHeight: '44px'
                  }}
                >
                  Install
                </button>
              ) : selectedWallet === wallet.id && isConnecting ? (
                <div
                  className="spinner"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderWidth: '2px'
                  }}
                />
              ) : (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: 'var(--radius-full)',
                  background: wallet.installed ? 'var(--color-success)' : 'var(--text-tertiary)'
                }}></div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 'var(--space-6)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: isMobile ? 'var(--text-xs)' : 'var(--text-sm)',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 var(--space-2) 0' }}>
            By connecting a wallet, you agree to CRYB's{' '}
            <span style={{
              color: 'var(--brand-primary)',
              cursor: 'pointer',
              textDecoration: 'none'
            }}>Terms of Service</span>{' '}
            and{' '}
            <span style={{
              color: 'var(--brand-primary)',
              cursor: 'pointer',
              textDecoration: 'none'
            }}>Privacy Policy</span>
          </p>
          <p style={{ margin: 0 }}>
            New to Web3?{' '}
            <span
              style={{
                color: 'var(--brand-primary)',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              onClick={() => window.open('https://ethereum.org/en/wallets/', '_blank')}
            >
              Learn about wallets
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}



export default WalletModal
