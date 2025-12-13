import React, { useState } from 'react'
import { Wallet, Shield, Zap, Check, AlertCircle, ExternalLink } from 'lucide-react'

function WalletConnectionPreview() {
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [connectionStep, setConnectionStep] = useState('select') // select, connecting, connected

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Most popular Ethereum wallet',
      icon: '🦊',
      popular: true,
      supported: true
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with 300+ wallets',
      icon: '📱',
      popular: true,
      supported: true
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Self-custody wallet by Coinbase',
      icon: '⚪',
      popular: true,
      supported: true
    },
    {
      id: 'phantom',
      name: 'Phantom',
      description: 'Solana wallet',
      icon: '👻',
      popular: false,
      supported: false
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      description: 'Mobile-first DeFi wallet',
      icon: '🔷',
      popular: false,
      supported: false
    },
    {
      id: 'ledger',
      name: 'Ledger',
      description: 'Hardware wallet',
      icon: '🔐',
      popular: false,
      supported: false
    }
  ]

  const handleWalletSelect = (wallet) => {
    if (!wallet.supported) return

    setSelectedWallet(wallet)
    setConnectionStep('connecting')

    // Simulate connection process
    setTimeout(() => {
      setConnectionStep('connected')
    }, 2000)
  }

  const resetConnection = () => {
    setSelectedWallet(null)
    setConnectionStep('select')
  }

  if (connectionStep === 'connected') {
    return (
      <div className="card" style={{
        padding: 'var(--space-8)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center' }}>
          {/* Success Animation */}
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            marginBottom: 'var(--space-6)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--color-success-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Check style={{
                height: '32px',
                width: '32px',
                color: 'var(--color-success)'
              }} />
            </div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              border: '2px solid var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-success)'
              }}></div>
            </div>
          </div>

          <h3 style={{
            fontWeight: 'var(--font-bold)',
            fontSize: 'var(--text-2xl)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)'
          }}>
            Wallet Connected!
          </h3>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            marginBottom: 'var(--space-6)'
          }}>
            {selectedWallet?.name} is now connected to your CRYB account
          </p>

          {/* Mock Wallet Info */}
          <div style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'left',
            marginBottom: 'var(--space-6)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)'
            }}>
              <div style={{ fontSize: 'var(--text-3xl)' }}>{selectedWallet?.icon}</div>
              <div>
                <div style={{
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-base)'
                }}>{selectedWallet?.name}</div>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)'
                }}>0x742d...4a8C</div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-4)'
            }}>
              <div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginBottom: 'var(--space-1)'
                }}>Network</div>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  fontWeight: 'var(--font-medium)'
                }}>Ethereum</div>
              </div>
              <div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginBottom: 'var(--space-1)'
                }}>Balance</div>
                <div style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  fontWeight: 'var(--font-medium)'
                }}>2.45 ETH</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-info-light)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'left',
            marginBottom: 'var(--space-6)'
          }}>
            <h4 style={{
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)'
            }}>What's Next?</h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <Check style={{
                  height: '12px',
                  width: '12px',
                  color: 'var(--color-success)',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)'
                }}>Set NFT as profile picture</span>
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <Check style={{
                  height: '12px',
                  width: '12px',
                  color: 'var(--color-success)',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)'
                }}>Access token-gated communities</span>
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <Check style={{
                  height: '12px',
                  width: '12px',
                  color: 'var(--color-success)',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)'
                }}>Send crypto payments</span>
              </li>
            </ul>
          </div>

          <div style={{
            display: 'flex',
            gap: 'var(--space-3)'
          }}>
            <button onClick={resetConnection} className="btn-secondary" style={{ flex: '1' }}>
              Disconnect
            </button>
            <button className="btn-primary" style={{ flex: '1' }}>
              Explore Features
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (connectionStep === 'connecting') {
    return (
      <div className="card" style={{
        padding: 'var(--space-8)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center' }}>
          {/* Loading Animation */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-6)'
          }}>
            <div style={{ fontSize: 'var(--text-3xl)' }}>{selectedWallet?.icon}</div>
          </div>

          <h3 style={{
            fontWeight: 'var(--font-bold)',
            fontSize: 'var(--text-2xl)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)'
          }}>
            Connecting to {selectedWallet?.name}
          </h3>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            marginBottom: 'var(--space-6)'
          }}>
            Please confirm the connection in your wallet
          </p>

          {/* Connection Steps */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            textAlign: 'left'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Check style={{
                  height: '12px',
                  width: '12px',
                  color: '#ffffff'
                }} />
              </div>
              <span style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-medium)'
              }}>Opening {selectedWallet?.name}</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ffffff'
                }}></div>
              </div>
              <span style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)'
              }}>Waiting for confirmation</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                border: '2px solid var(--border-subtle)',
                flexShrink: 0
              }}></div>
              <span style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)'
              }}>Connecting to CRYB</span>
            </div>
          </div>

          <button onClick={resetConnection} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{
      padding: 'var(--space-8)',
      maxWidth: '700px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--bg-gradient-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-4)'
        }}>
          <Wallet style={{
            height: '32px',
            width: '32px',
            color: 'var(--brand-primary)'
          }} />
        </div>

        <h3 style={{
          fontWeight: 'var(--font-bold)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)'
        }}>
          Connect Your Wallet
        </h3>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-base)'
        }}>
          Choose a wallet to connect to CRYB and unlock Web3 features
        </p>
      </div>

      {/* Wallet Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)'
      }}>
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => handleWalletSelect(wallet)}
            disabled={!wallet.supported}
            className="card-interactive"
            style={{
              padding: 'var(--space-4)',
              textAlign: 'left',
              cursor: wallet.supported ? 'pointer' : 'not-allowed',
              opacity: wallet.supported ? 1 : 0.5
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)'
            }}>
              <div style={{ fontSize: 'var(--text-4xl)' }}>{wallet.icon}</div>
              <div style={{ flex: '1' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-1)'
                }}>
                  <span style={{
                    fontWeight: 'var(--font-medium)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)'
                  }}>{wallet.name}</span>
                  {wallet.popular && (
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-info-light)',
                      color: 'var(--color-info-dark)',
                      fontWeight: 'var(--font-medium)'
                    }}>
                      Popular
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-2)'
                }}>{wallet.description}</p>
                {!wallet.supported && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)'
                  }}>
                    <AlertCircle style={{
                      height: '12px',
                      width: '12px',
                      color: 'var(--color-warning)'
                    }} />
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-warning)'
                    }}>Coming Soon</span>
                  </div>
                )}
              </div>
              {wallet.supported && (
                <div>
                  <ExternalLink style={{
                    height: '16px',
                    width: '16px',
                    color: 'var(--text-tertiary)'
                  }} />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Security Note */}
      <div style={{
        padding: 'var(--space-4)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-tertiary)',
        marginBottom: 'var(--space-6)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)'
        }}>
          <Shield style={{
            height: '20px',
            width: '20px',
            color: 'var(--color-success)',
            flexShrink: 0,
            marginTop: '2px'
          }} />
          <div>
            <h4 style={{
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-1)'
            }}>Secure Connection</h4>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)'
            }}>
              CRYB never stores your private keys. Your wallet connection is secure and can be disconnected at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Preview */}
      <div style={{ textAlign: 'center' }}>
        <h4 style={{
          fontWeight: 'var(--font-semibold)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-3)'
        }}>What you'll unlock:</h4>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          justifyContent: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <Zap style={{
              height: '16px',
              width: '16px',
              color: 'var(--brand-primary)',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)'
            }}>NFT Profile Pictures</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <Zap style={{
              height: '16px',
              width: '16px',
              color: 'var(--brand-primary)',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)'
            }}>Crypto Payments</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <Zap style={{
              height: '16px',
              width: '16px',
              color: 'var(--brand-primary)',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)'
            }}>Token Gating</span>
          </div>
        </div>
      </div>
    </div>
  )
}




export default WalletConnectionPreview
