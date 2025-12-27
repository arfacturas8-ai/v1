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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '16px' : '20px',
        zIndex: 1100, // Modal layer
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : isTablet ? '500px' : '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid #E8EAED',
          padding: isMobile ? '20px' : '24px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid #E8EAED'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '700',
              color: '#1A1A1A',
              margin: 0,
              marginBottom: '4px'
            }}>
              Connect Wallet
            </h2>
            <p style={{
              margin: 0,
              fontSize: isMobile ? '14px' : '15px',
              color: '#666666'
            }}>
              Connect your wallet to access Web3 features
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: isMobile ? '28px' : '32px',
              padding: '4px',
              borderRadius: '12px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666666',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F0F2F5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#DC2626',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #FCA5A5',
            marginBottom: '20px',
            fontSize: isMobile ? '14px' : '15px'
          }}>
            {typeof error === "string" ? error : getErrorMessage(error, "")}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {walletOptions.map((wallet) => (
            <div
              key={wallet.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: selectedWallet === wallet.id
                  ? '2px solid #58a6ff'
                  : '1px solid #E8EAED',
                background: selectedWallet === wallet.id
                  ? 'rgba(88, 166, 255, 0.1)'
                  : '#FFFFFF',
                borderRadius: '12px',
                boxShadow: selectedWallet === wallet.id ? '0 2px 8px rgba(88, 166, 255, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                transform: selectedWallet === wallet.id ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onClick={() => wallet.installed ? handleWalletConnect(wallet) : handleInstallWallet(wallet.id)}
              onMouseEnter={(e) => {
                if (selectedWallet !== wallet.id) {
                  e.currentTarget.style.borderColor = '#CCCCCC';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedWallet !== wallet.id) {
                  e.currentTarget.style.borderColor = '#E8EAED';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#F8F9FA',
                border: '1px solid #E8EAED',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {wallet.icon}
              </div>

              <div style={{
                flex: '1',
                marginLeft: '16px',
                minWidth: 0
              }}>
                <div style={{
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: '600',
                  color: '#1A1A1A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {wallet.name}
                </div>
                <div style={{
                  fontSize: isMobile ? '12px' : '13px',
                  color: '#666666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {wallet.description}
                </div>
              </div>

              {!wallet.installed ? (
                <button
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    minHeight: '44px',
                    background: '#F8F9FA',
                    color: '#666666',
                    border: '1px solid #E8EAED',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F0F2F5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F8F9FA'}
                >
                  Install
                </button>
              ) : selectedWallet === wallet.id && isConnecting ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #E8EAED',
                  borderTopColor: '#58a6ff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: wallet.installed ? '#10B981' : '#CCCCCC'
                }}></div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #E8EAED',
          fontSize: isMobile ? '12px' : '13px',
          color: '#666666',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            By connecting a wallet, you agree to CRYB's{' '}
            <span style={{
              color: '#58a6ff',
              cursor: 'pointer',
              textDecoration: 'none'
            }}>Terms of Service</span>{' '}
            and{' '}
            <span style={{
              color: '#58a6ff',
              cursor: 'pointer',
              textDecoration: 'none'
            }}>Privacy Policy</span>
          </p>
          <p style={{ margin: 0 }}>
            New to Web3?{' '}
            <span
              style={{
                color: '#58a6ff',
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
