import React, { useState, useEffect } from 'react'
import { ChevronRight, ExternalLink, Play, Pause } from 'lucide-react'

function Web3FeaturePreview({ feature }) {
  const [isAnimating, setIsAnimating] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!isAnimating) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 3)
    }, 2000)

    return () => clearInterval(interval)
  }, [isAnimating])

  const IconComponent = feature.icon

  // Mock data for different feature types
  const getFeatureDemo = () => {
    switch (feature.title) {
      case 'Wallet Integration':
        return {
          steps: [
            { label: 'Connect Wallet', status: currentStep >= 0 ? 'complete' : 'pending' },
            { label: 'Verify Identity', status: currentStep >= 1 ? 'complete' : 'pending' },
            { label: 'Access Features', status: currentStep >= 2 ? 'complete' : 'pending' }
          ],
          mockWallet: {
            address: '0x742d...4a8C',
            balance: '2.45 ETH',
            network: 'Ethereum Mainnet'
          }
        }

      case 'NFT Profile System':
        return {
          steps: [
            { label: 'Scan Collections', status: currentStep >= 0 ? 'complete' : 'pending' },
            { label: 'Select Avatar', status: currentStep >= 1 ? 'complete' : 'pending' },
            { label: 'Update Profile', status: currentStep >= 2 ? 'complete' : 'pending' }
          ],
          mockNFTs: [
            { name: 'Bored Ape #1234', collection: 'BAYC', selected: currentStep >= 1 },
            { name: 'CryptoPunk #5678', collection: 'CryptoPunks', selected: false },
            { name: 'Azuki #9012', collection: 'Azuki', selected: false }
          ]
        }

      case 'Crypto Payments':
        return {
          steps: [
            { label: 'Select Currency', status: currentStep >= 0 ? 'complete' : 'pending' },
            { label: 'Enter Amount', status: currentStep >= 1 ? 'complete' : 'pending' },
            { label: 'Confirm Transaction', status: currentStep >= 2 ? 'complete' : 'pending' }
          ],
          mockPayment: {
            from: 'You',
            to: '@cryptouser',
            amount: '50 USDC',
            fee: '0.1 USDC'
          }
        }

      case 'Token Gating':
        return {
          steps: [
            { label: 'Check Holdings', status: currentStep >= 0 ? 'complete' : 'pending' },
            { label: 'Verify Ownership', status: currentStep >= 1 ? 'complete' : 'pending' },
            { label: 'Grant Access', status: currentStep >= 2 ? 'complete' : 'pending' }
          ],
          mockTokens: [
            { symbol: 'CRYB', amount: '1,000', required: '500', access: true },
            { symbol: 'UNI', amount: '25', required: '10', access: true },
            { symbol: 'COMP', amount: '5', required: '20', access: false }
          ]
        }

      case 'DeFi Integration':
        return {
          steps: [
            { label: 'Connect Protocols', status: currentStep >= 0 ? 'complete' : 'pending' },
            { label: 'Sync Portfolio', status: currentStep >= 1 ? 'complete' : 'pending' },
            { label: 'Display Analytics', status: currentStep >= 2 ? 'complete' : 'pending' }
          ],
          mockDefi: {
            totalValue: '$12,543.21',
            protocols: ['Uniswap', 'Compound', 'Aave'],
            apr: '8.3%'
          }
        }

      case 'DAO Governance':
        return {
          steps: [
            { label: 'Load Proposals', status: currentStep >= 0 ? 'complete' : 'pending' },
            { label: 'Cast Vote', status: currentStep >= 1 ? 'complete' : 'pending' },
            { label: 'Update Results', status: currentStep >= 2 ? 'complete' : 'pending' }
          ],
          mockProposal: {
            title: 'Add Dark Mode Support',
            votes: { for: 1247, against: 89 },
            timeLeft: '2 days'
          }
        }

      default:
        return {
          steps: [
            { label: 'Initialize', status: 'complete' },
            { label: 'Process', status: 'pending' },
            { label: 'Complete', status: 'pending' }
          ]
        }
    }
  }

  const demo = getFeatureDemo()

  return (
    <div className="card" style={{ padding: 'var(--space-8)' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-8)',
        alignItems: 'center'
      }}>
        {/* Feature Info */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)'
          }}>
            <div style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-gradient-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconComponent style={{
                height: '24px',
                width: '24px',
                color: 'var(--brand-primary)'
              }} />
            </div>
            <h3 style={{
              fontWeight: 'var(--font-bold)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-primary)'
            }}>{feature.title}</h3>
          </div>

          <p style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-6)',
            lineHeight: 'var(--leading-relaxed)'
          }}>
            {feature.description}
          </p>

          <div style={{
            padding: 'var(--space-4)',
            border: '1px solid var(--border-subtle)',
            borderLeft: '4px solid var(--brand-primary)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-tertiary)',
            marginBottom: 'var(--space-6)'
          }}>
            <p style={{
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-base)',
              fontStyle: 'italic'
            }}>
              "{feature.preview}"
            </p>
          </div>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h4 style={{
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)'
            }}>Key Benefits:</h4>
            {feature.benefits.map((benefit, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-2)'
              }}>
                <ChevronRight style={{
                  height: '16px',
                  width: '16px',
                  color: 'var(--brand-primary)',
                  flexShrink: 0
                }} />
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)'
                }}>{benefit}</span>
              </div>
            ))}
          </div>

          <button className="btn-secondary" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span>Learn More</span>
            <ExternalLink style={{ height: '16px', width: '16px' }} />
          </button>
        </div>

        {/* Interactive Demo */}
        <div style={{
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Demo Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-4)'
          }}>
            <h4 style={{
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)'
            }}>Live Preview</h4>
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label={isAnimating ? 'Pause animation' : 'Play animation'}
            >
              {isAnimating ? (
                <Pause style={{ height: '16px', width: '16px', color: 'var(--text-primary)' }} />
              ) : (
                <Play style={{ height: '16px', width: '16px', color: 'var(--text-primary)' }} />
              )}
            </button>
          </div>

          {/* Demo Steps */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)'
          }}>
            {demo.steps.map((step, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: step.status === 'complete' ? 'var(--color-success)' : 'var(--border-subtle)',
                  flexShrink: 0
                }}></div>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: step.status === 'complete' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: step.status === 'complete' ? 'var(--font-medium)' : 'var(--font-regular)'
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Feature-Specific Demo Content */}
          <div style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}>
            {feature.title === 'Wallet Integration' && (
              <div>
                <div style={{
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                  fontSize: 'var(--text-sm)'
                }}>Connected Wallet</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-1)'
                }}>Address: {demo.mockWallet.address}</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-1)'
                }}>Balance: {demo.mockWallet.balance}</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-success)',
                  marginTop: 'var(--space-2)'
                }}>✓ {demo.mockWallet.network}</div>
              </div>
            )}

            {feature.title === 'NFT Profile System' && (
              <div>
                <div style={{
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                  fontSize: 'var(--text-sm)'
                }}>Your Collections</div>
                {demo.mockNFTs.map((nft, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)'
                    }}>{nft.name}</span>
                    {nft.selected && (
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-success)',
                        fontWeight: 'var(--font-medium)'
                      }}>✓ Active</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {feature.title === 'Crypto Payments' && (
              <div>
                <div style={{
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                  fontSize: 'var(--text-sm)'
                }}>Payment Details</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-1)'
                }}>From: {demo.mockPayment.from}</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-1)'
                }}>To: {demo.mockPayment.to}</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--brand-primary)',
                  marginBottom: 'var(--space-1)',
                  fontWeight: 'var(--font-medium)'
                }}>Amount: {demo.mockPayment.amount}</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)'
                }}>Fee: {demo.mockPayment.fee}</div>
              </div>
            )}

            {feature.title === 'Token Gating' && (
              <div>
                <div style={{
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                  fontSize: 'var(--text-sm)'
                }}>Token Holdings</div>
                {demo.mockTokens.map((token, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)'
                    }}>{token.symbol}: {token.amount}</span>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: token.access ? 'var(--color-success)' : 'var(--color-error)',
                      fontWeight: 'var(--font-medium)'
                    }}>
                      {token.access ? '✓ Access' : '✗ Insufficient'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {feature.title === 'DeFi Integration' && (
              <div>
                <div style={{
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                  fontSize: 'var(--text-sm)'
                }}>Portfolio Overview</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--brand-primary)',
                  marginBottom: 'var(--space-1)',
                  fontWeight: 'var(--font-medium)'
                }}>Total Value: {demo.mockDefi.totalValue}</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-success)',
                  marginBottom: 'var(--space-2)'
                }}>APR: {demo.mockDefi.apr}</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)'
                }}>
                  Protocols: {demo.mockDefi.protocols.join(', ')}
                </div>
              </div>
            )}

            {feature.title === 'DAO Governance' && (
              <div>
                <div style={{
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                  fontSize: 'var(--text-sm)'
                }}>Active Proposal</div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-2)'
                }}>{demo.mockProposal.title}</div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)'
                }}>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-success)'
                  }}>For: {demo.mockProposal.votes.for}</span>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-error)'
                  }}>Against: {demo.mockProposal.votes.against}</span>
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-warning)'
                }}>⏳ {demo.mockProposal.timeLeft} left</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}




export default Web3FeaturePreview
