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
    <div className="card p-2xl">
      <div style={{
  display: 'grid',
  gap: '8px',
  alignItems: 'center'
}}>
        {/* Feature Info */}
        <div>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  borderRadius: '12px'
}}>
              <IconComponent style={{
  height: '24px',
  width: '24px'
}} />
            </div>
            <h3 style={{
  fontWeight: 'bold'
}}>{feature.title}</h3>
          </div>
          
          <p className="text-lg text-secondary mb-lg leading-relaxed">
            {feature.description}
          </p>
          
          <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
            <p style={{
  fontWeight: '500'
}}>
              "{feature.preview}"
            </p>
          </div>
          
          <div className="space-y-sm mb-lg">
            <h4 style={{
  fontWeight: '600'
}}>Key Benefits:</h4>
            {feature.benefits.map((benefit, index) => (
              <div key={index} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <ChevronRight style={{
  height: '16px',
  width: '16px'
}} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
          
          <button className="btn btn-secondary group">
            <span>Learn More</span>
            <ExternalLink style={{
  height: '16px',
  width: '16px'
}} />
          </button>
        </div>

        {/* Interactive Demo */}
        <div style={{
  borderRadius: '12px'
}}>
          {/* Demo Controls */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h4 style={{
  fontWeight: '600'
}}>Live Preview</h4>
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="btn-icon"
              aria-label={isAnimating ? 'Pause animation' : 'Play animation'}
            >
              {isAnimating ? (
                <Pause style={{
  height: '16px',
  width: '16px'
}} />
              ) : (
                <Play style={{
  height: '16px',
  width: '16px'
}} />
              )}
            </button>
          </div>

          {/* Demo Steps */}
          <div className="space-y-md mb-lg">
            {demo.steps.map((step, index) => (
              <div key={index} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
                <span className={`text-sm ${
                  step.status === 'complete' ? 'text-primary' : 'text-muted'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Feature-Specific Demo Content */}
          <div style={{
  borderRadius: '12px'
}}>
            {feature.title === 'Wallet Integration' && (
              <div>
                <div style={{
  fontWeight: '500'
}}>Connected Wallet</div>
                <div className="text-muted">Address: {demo.mockWallet.address}</div>
                <div className="text-muted">Balance: {demo.mockWallet.balance}</div>
                <div className="text-success text-xs mt-sm">✓ {demo.mockWallet.network}</div>
              </div>
            )}

            {feature.title === 'NFT Profile System' && (
              <div>
                <div style={{
  fontWeight: '500'
}}>Your Collections</div>
                {demo.mockNFTs.map((nft, index) => (
                  <div key={index} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                    <span className="text-xs">{nft.name}</span>
                    {nft.selected && <span className="text-xs">✓ Active</span>}
                  </div>
                ))}
              </div>
            )}

            {feature.title === 'Crypto Payments' && (
              <div>
                <div style={{
  fontWeight: '500'
}}>Payment Details</div>
                <div className="text-muted text-xs">From: {demo.mockPayment.from}</div>
                <div className="text-muted text-xs">To: {demo.mockPayment.to}</div>
                <div className="text-accent-light text-xs">Amount: {demo.mockPayment.amount}</div>
                <div className="text-muted text-xs">Fee: {demo.mockPayment.fee}</div>
              </div>
            )}

            {feature.title === 'Token Gating' && (
              <div>
                <div style={{
  fontWeight: '500'
}}>Token Holdings</div>
                {demo.mockTokens.map((token, index) => (
                  <div key={index} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                    <span className="text-muted">{token.symbol}: {token.amount}</span>
                    <span className={token.access ? 'text-success' : 'text-error'}>
                      {token.access ? '✓ Access' : '✗ Insufficient'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {feature.title === 'DeFi Integration' && (
              <div>
                <div style={{
  fontWeight: '500'
}}>Portfolio Overview</div>
                <div className="text-accent-light text-xs">Total Value: {demo.mockDefi.totalValue}</div>
                <div className="text-success text-xs">APR: {demo.mockDefi.apr}</div>
                <div className="text-muted text-xs mt-sm">
                  Protocols: {demo.mockDefi.protocols.join(', ')}
                </div>
              </div>
            )}

            {feature.title === 'DAO Governance' && (
              <div>
                <div style={{
  fontWeight: '500'
}}>Active Proposal</div>
                <div className="text-muted text-xs mb-sm">{demo.mockProposal.title}</div>
                <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                  <span className="text-success">For: {demo.mockProposal.votes.for}</span>
                  <span className="text-error">Against: {demo.mockProposal.votes.against}</span>
                </div>
                <div className="text-warning text-xs mt-sm">⏳ {demo.mockProposal.timeLeft} left</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}




export default Web3FeaturePreview
