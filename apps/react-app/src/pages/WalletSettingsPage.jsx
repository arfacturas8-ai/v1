/**
 * WalletSettingsPage - Modernized with iOS Aesthetic
 *
 * Design System:
 * - Background: #FAFAFA
 * - Text: #000 primary, #666 secondary
 * - Cards: white with subtle shadows
 * - Borders: 16-24px radius
 * - Buttons: 56px/48px height, 12-14px radius
 * - Icons: 20px
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04) cards, 0 8px 32px rgba(0,0,0,0.08) modals
 * - Gradient: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)
 * - Hover: translateY(-2px) + enhanced shadow
 */

import React, { memo, useState } from 'react'
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
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        padding: '24px'
      }}
      role="main"
      aria-label="Wallet settings page"
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Wallet style={{ color: 'white', width: '20px', height: '20px', flexShrink: 0 }} />
            </div>
            <h1 style={{ color: '#000', fontSize: '28px', fontWeight: 700, margin: 0 }}>Wallet Settings</h1>
          </div>
          <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Manage your connected wallets and preferences</p>
        </div>

        {/* Connected Wallets */}
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ color: '#000', fontSize: '20px', fontWeight: 700, margin: 0 }}>Connected Wallets</h2>
            <button
              style={{
                height: '48px',
                padding: '0 24px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Link2 style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              <span>Connect Wallet</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {wallets.map(wallet => (
              <div
                key={wallet.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px',
                  background: '#FAFAFA',
                  borderRadius: '16px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F5F5F5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FAFAFA'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Wallet style={{ width: '20px', height: '20px', color: 'white', flexShrink: 0 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#000', fontSize: '16px', fontWeight: 600 }}>{wallet.type}</span>
                      {wallet.primary && (
                        <span
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#000000'
                          }}
                        >
                          Primary
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px' }}>
                      <span>{wallet.address}</span>
                      <button
                        onClick={() => copyAddress(wallet.address)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#666',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                      >
                        {copied ? <Check style={{ width: '16px', height: '16px', flexShrink: 0 }} /> : <Copy style={{ width: '16px', height: '16px', flexShrink: 0 }} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#EF4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                  }}
                >
                  <Unlink style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Shield style={{ width: '20px', height: '20px', color: '#000000', flexShrink: 0 }} />
            <h2 style={{ color: '#000', fontSize: '20px', fontWeight: 700, margin: 0 }}>Security</h2>
          </div>
          <p style={{ color: '#666', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
            Your wallet connections are encrypted and secured. We never store your private keys.
          </p>
          <a
            href="https://docs.example.com/wallet-security"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#000000',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Learn more about wallet security
            <ExternalLink style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          </a>
        </div>
      </div>
    </div>
  )
}

export default memo(WalletSettingsPage)
