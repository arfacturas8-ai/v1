import React, { useState } from 'react'

const CryptoWalletStep = ({ onComplete, onSkip }) => {
  const [walletStatus, setWalletStatus] = useState('disconnected') // disconnected, connecting, connected, error
  const [walletAddress, setWalletAddress] = useState('')
  const [walletType, setWalletType] = useState('')

  const connectWallet = async (type) => {
    setWalletStatus('connecting')
    setWalletType(type)

    try {
      if (type === 'metamask') {
        if (typeof window.ethereum === 'undefined') {
          setWalletStatus('error')
          alert('MetaMask is not installed. Please install MetaMask extension from metamask.io')
          return
        }

        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0])
            setWalletStatus('connected')

            // Check network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' })
            if (chainId !== '0x1') {
              console.warn('Not on Ethereum mainnet. ChainId:', chainId)
            }
          } else {
            throw new Error('No accounts returned')
          }
        } catch (err) {
          if (err.code === 4001) {
            // User rejected
            setWalletStatus('disconnected')
            alert('Connection request rejected. Please try again.')
          } else {
            throw err
          }
        }
      }
      // Add other wallet types here
    } catch (error) {
      console.error('Wallet connection failed:', error)
      setWalletStatus('error')
      alert(`Failed to connect wallet: ${error.message}`)
    }
  }

  const disconnectWallet = () => {
    setWalletStatus('disconnected')
    setWalletAddress('')
    setWalletType('')
  }

  return (
    <div style={{
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
      <div style={{
  textAlign: 'center'
}}>
        <h3 style={{
  fontWeight: 'bold',
  color: '#A0A0A0'
}}>Connect Your Wallet</h3>
        <p style={{
  color: '#A0A0A0'
}}>
          Connect your crypto wallet to earn CRYB tokens and access Web3 features.
        </p>
      </div>

      {walletStatus === 'disconnected' && (
        <div className="space-y-6">
          <div style={{
  padding: '24px',
  borderRadius: '12px'
}}>
            <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>💰 Why Connect Your Wallet?</h4>
            <div style={{
  display: 'grid',
  gap: '16px',
  color: '#A0A0A0'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                <span className="text-green-500 mt-1">✓</span>
                <span>Earn CRYB tokens for community participation</span>
              </div>
              <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                <span className="text-green-500 mt-1">✓</span>
                <span>Access exclusive Web3 features</span>
              </div>
              <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                <span className="text-green-500 mt-1">✓</span>
                <span>Trade and showcase your NFTs</span>
              </div>
              <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                <span className="text-green-500 mt-1">✓</span>
                <span>Participate in governance voting</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Choose Your Wallet</h4>
            <div className="space-y-3">
              <button
                onClick={() => connectWallet('metamask')}
                style={{
  width: '100%',
  padding: '16px',
  border: '1px solid #E8EAED',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  background: '#FFFFFF',
  cursor: 'pointer',
  transition: 'all 0.2s'
}}
              >
                <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <span style={{
  color: '#ffffff',
  fontWeight: 'bold'
}}>M</span>
                </div>
                <div style={{
  textAlign: 'left',
  flex: '1'
}}>
                  <div style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>MetaMask</div>
                  <div style={{
  color: '#A0A0A0'
}}>Most popular Ethereum wallet</div>
                </div>
                <div style={{
  color: '#A0A0A0'
}}>
                  <svg style={{
  width: '24px',
  height: '24px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => connectWallet('walletconnect')}
                style={{
  width: '100%',
  padding: '16px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center'
}}
              >
                <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <span style={{
  color: '#ffffff',
  fontWeight: 'bold'
}}>W</span>
                </div>
                <div style={{
  textAlign: 'left',
  flex: '1'
}}>
                  <div style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>WalletConnect</div>
                  <div style={{
  color: '#A0A0A0'
}}>Connect any mobile wallet</div>
                </div>
                <div style={{
  color: '#A0A0A0'
}}>
                  <svg style={{
  width: '24px',
  height: '24px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => connectWallet('coinbase')}
                style={{
  width: '100%',
  padding: '16px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center'
}}
              >
                <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <span style={{
  color: '#ffffff',
  fontWeight: 'bold'
}}>C</span>
                </div>
                <div style={{
  textAlign: 'left',
  flex: '1'
}}>
                  <div style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Coinbase Wallet</div>
                  <div style={{
  color: '#A0A0A0'
}}>User-friendly wallet by Coinbase</div>
                </div>
                <div style={{
  color: '#A0A0A0'
}}>
                  <svg style={{
  width: '24px',
  height: '24px'
}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
            <h5 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>🔒 Security Note</h5>
            <p style={{
  color: '#A0A0A0'
}}>
              CRYB will never ask for your private keys or seed phrase. 
              Only connect wallets you trust and keep your private keys secure.
            </p>
          </div>
        </div>
      )}

      {walletStatus === 'connecting' && (
        <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
          <div style={{
  borderRadius: '50%',
  height: '48px',
  width: '48px'
}}></div>
          <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Connecting to {walletType}...</h4>
          <p style={{
  color: '#A0A0A0'
}}>Please check your wallet and approve the connection.</p>
        </div>
      )}

      {walletStatus === 'connected' && (
        <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
          <div className="text-6xl mb-4">🎉</div>
          <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Wallet Connected!</h4>
          <p style={{
  color: '#A0A0A0'
}}>
            Your {walletType} wallet is now connected to CRYB.
          </p>
          
          <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
            <div style={{
  color: '#A0A0A0'
}}>Connected Address:</div>
            <div style={{
  color: '#A0A0A0'
}}>
              {walletAddress}
            </div>
          </div>

          <button
            onClick={disconnectWallet}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Disconnect Wallet
          </button>
        </div>
      )}

      {walletStatus === 'error' && (
        <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
          <div className="text-6xl mb-4">❌</div>
          <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Connection Failed</h4>
          <p style={{
  color: '#A0A0A0'
}}>
            Unable to connect to your wallet. Please try again.
          </p>
          
          <button
            onClick={() => setWalletStatus('disconnected')}
            style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
          >
            Try Again
          </button>
        </div>
      )}

      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
        <button
          onClick={onSkip}
          style={{
  color: '#A0A0A0'
}}
        >
          Skip for now
        </button>
        
        <button
          onClick={onComplete}
          style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
        >
          Continue
        </button>
      </div>
    </div>
  )
}




export default CryptoWalletStep
