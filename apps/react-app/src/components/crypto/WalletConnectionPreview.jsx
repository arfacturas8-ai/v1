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
      <div className="card p-2xl max-w-md mx-auto">
        <div style={{
  textAlign: 'center'
}}>
          {/* Success Animation */}
          <div style={{
  position: 'relative'
}}>
            <div style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              <Check style={{
  height: '32px',
  width: '32px'
}} />
            </div>
            <div style={{
  position: 'absolute',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
            </div>
          </div>

          <h3 style={{
  fontWeight: 'bold'
}}>
            Wallet Connected!
          </h3>
          
          <p className="text-secondary mb-lg">
            {selectedWallet?.name} is now connected to your CRYB account
          </p>

          {/* Mock Wallet Info */}
          <div style={{
  borderRadius: '12px',
  textAlign: 'left'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div className="text-2xl">{selectedWallet?.icon}</div>
              <div>
                <div style={{
  fontWeight: '500'
}}>{selectedWallet?.name}</div>
                <div className="text-sm text-muted">0x742d...4a8C</div>
              </div>
            </div>
            
            <div style={{
  display: 'grid'
}}>
              <div>
                <div className="text-muted">Network</div>
                <div className="text-primary">Ethereum</div>
              </div>
              <div>
                <div className="text-muted">Balance</div>
                <div className="text-primary">2.45 ETH</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div style={{
  borderRadius: '12px',
  textAlign: 'left'
}}>
            <h4 style={{
  fontWeight: '600'
}}>What's Next?</h4>
            <ul className="space-y-sm text-sm text-secondary">
              <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <Check style={{
  height: '12px',
  width: '12px'
}} />
                <span>Set NFT as profile picture</span>
              </li>
              <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <Check style={{
  height: '12px',
  width: '12px'
}} />
                <span>Access token-gated communities</span>
              </li>
              <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <Check style={{
  height: '12px',
  width: '12px'
}} />
                <span>Send crypto payments</span>
              </li>
            </ul>
          </div>

          <div style={{
  display: 'flex'
}}>
            <button onClick={resetConnection} style={{
  flex: '1'
}}>
              Disconnect
            </button>
            <button style={{
  flex: '1'
}}>
              Explore Features
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (connectionStep === 'connecting') {
    return (
      <div className="card p-2xl max-w-md mx-auto">
        <div style={{
  textAlign: 'center'
}}>
          {/* Loading Animation */}
          <div style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            <div className="text-2xl">{selectedWallet?.icon}</div>
          </div>

          <h3 style={{
  fontWeight: 'bold'
}}>
            Connecting to {selectedWallet?.name}
          </h3>
          
          <p className="text-secondary mb-lg">
            Please confirm the connection in your wallet
          </p>

          {/* Connection Steps */}
          <div className="space-y-md mb-lg">
            <div style={{
  display: 'flex',
  alignItems: 'center',
  textAlign: 'left'
}}>
              <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <Check style={{
  height: '12px',
  width: '12px',
  color: '#ffffff'
}} />
              </div>
              <span className="text-sm text-primary">Opening {selectedWallet?.name}</span>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  textAlign: 'left'
}}>
              <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
              </div>
              <span className="text-sm text-secondary">Waiting for confirmation</span>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  textAlign: 'left'
}}>
              <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%'
}}></div>
              <span className="text-sm text-muted">Connecting to CRYB</span>
            </div>
          </div>

          <button onClick={resetConnection} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-2xl max-w-2xl mx-auto">
      <div style={{
  textAlign: 'center'
}}>
        <div style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <Wallet style={{
  height: '32px',
  width: '32px'
}} />
        </div>
        
        <h3 style={{
  fontWeight: 'bold'
}}>
          Connect Your Wallet
        </h3>
        
        <p className="text-secondary">
          Choose a wallet to connect to CRYB and unlock Web3 features
        </p>
      </div>

      {/* Wallet Grid */}
      <div style={{
  display: 'grid'
}}>
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => handleWalletSelect(wallet)}
            disabled={!wallet.supported}
            style={{
  textAlign: 'left'
}}
          >
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div className="text-3xl">{wallet.icon}</div>
              <div style={{
  flex: '1'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <span style={{
  fontWeight: '500'
}}>{wallet.name}</span>
                  {wallet.popular && (
                    <span style={{
  paddingTop: '0px',
  paddingBottom: '0px',
  borderRadius: '4px'
}}>
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary">{wallet.description}</p>
                {!wallet.supported && (
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <AlertCircle style={{
  height: '12px',
  width: '12px'
}} />
                    <span className="text-xs text-warning">Coming Soon</span>
                  </div>
                )}
              </div>
              {wallet.supported && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink style={{
  height: '16px',
  width: '16px'
}} />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Security Note */}
      <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
          <Shield style={{
  height: '20px',
  width: '20px'
}} />
          <div>
            <h4 style={{
  fontWeight: '600'
}}>Secure Connection</h4>
            <p className="text-sm text-secondary">
              CRYB never stores your private keys. Your wallet connection is secure and can be disconnected at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Preview */}
      <div style={{
  textAlign: 'center'
}}>
        <h4 style={{
  fontWeight: '600'
}}>What you'll unlock:</h4>
        <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <Zap style={{
  height: '16px',
  width: '16px'
}} />
            <span>NFT Profile Pictures</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <Zap style={{
  height: '16px',
  width: '16px'
}} />
            <span>Crypto Payments</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <Zap style={{
  height: '16px',
  width: '16px'
}} />
            <span>Token Gating</span>
          </div>
        </div>
      </div>
    </div>
  )
}




export default WalletConnectionPreview
