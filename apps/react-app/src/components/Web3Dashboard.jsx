import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../Web3Provider'
import WalletModal from './WalletModal'

const Web3Dashboard = () => {
  const {
    account,
    chainId,
    balance,
    cribBalance,
    connectedWallet,
    isCorrectNetwork,
    switchNetwork,
    addTokenToWallet,
    disconnect,
    signMessage,
    SUPPORTED_NETWORKS,
    error,
    clearError
  } = useWeb3()

  const [showWalletModal, setShowWalletModal] = useState(false)
  const [stakingAmount, setStakingAmount] = useState('')
  const [rewardsEarned, setRewardsEarned] = useState('0')
  const [nftCollection, setNftCollection] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSignMessage, setShowSignMessage] = useState(false)
  const [messageToSign, setMessageToSign] = useState('')
  const [signedMessage, setSignedMessage] = useState('')

  // Mock data for demonstration
  const mockNFTs = [
    {
      id: 1,
      name: 'CRYB Genesis #001',
      image: 'https://via.placeholder.com/200x200/6366f1/ffffff?text=NFT+1',
      traits: { rarity: 'Legendary', power: 95 }
    },
    {
      id: 2,
      name: 'CRYB Genesis #024',
      image: 'https://via.placeholder.com/200x200/8b5cf6/ffffff?text=NFT+2',
      traits: { rarity: 'Epic', power: 78 }
    },
    {
      id: 3,
      name: 'CRYB Genesis #156',
      image: 'https://via.placeholder.com/200x200/06b6d4/ffffff?text=NFT+3',
      traits: { rarity: 'Rare', power: 65 }
    }
  ]

  useEffect(() => {
    // Simulate loading rewards and NFTs
    if (account) {
      setNftCollection(mockNFTs)
      setRewardsEarned('1,250.45')
    }
  }, [account])

  const handleStake = async () => {
    if (!stakingAmount || parseFloat(stakingAmount) <= 0) {
      alert('Please enter a valid staking amount')
      return
    }

    setIsLoading(true)
    try {
      // Simulate staking transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`Successfully staked ${stakingAmount} CRYB tokens!`)
      setStakingAmount('')
    } catch (error) {
      alert('Staking failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimRewards = async () => {
    setIsLoading(true)
    try {
      // Simulate claim transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`Successfully claimed ${rewardsEarned} CRYB tokens!`)
      setRewardsEarned('0')
    } catch (error) {
      alert('Claim failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignMessage = async () => {
    if (!messageToSign.trim()) {
      alert('Please enter a message to sign')
      return
    }

    try {
      const signature = await signMessage(messageToSign)
      setSignedMessage(signature)
      alert('Message signed successfully!')
    } catch (error) {
      alert('Failed to sign message: ' + error.message)
    }
  }

  const handleAddCribToken = async () => {
    try {
      await addTokenToWallet(
        '0x...', // CRYB token address
        'CRYB',
        18,
        'https://cryb.ai/logo.png'
      )
    } catch (error) {
      alert('Failed to add token: ' + error.message)
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getCurrentNetwork = () => {
    return SUPPORTED_NETWORKS[chainId] || { name: 'Unknown Network', symbol: 'ETH' }
  }

  // Styles
  const containerStyle = {
    minHeight: 'calc(100vh - 64px)',
    backgroundColor: 'var(--gray-1)',
    padding: '24px'
  }

  const cardStyle = {
    backgroundColor: 'var(--gray-2)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    border: '1px solid var(--gray-6)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }

  const gradientCardStyle = {
    ...cardStyle,
    background: 'linear-gradient(135deg, var(--blue-9), var(--blue-11))',
    color: 'var(--blue-contrast)',
    border: 'none'
  }

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--blue-9), var(--blue-11))',
    color: 'var(--blue-contrast)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  }

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'var(--gray-3)',
    color: 'var(--gray-12)',
    border: '1px solid var(--gray-6)'
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--gray-6)',
    backgroundColor: 'var(--gray-1)',
    color: 'var(--gray-12)',
    fontSize: '16px',
    outline: 'none'
  }

  const nftCardStyle = {
    backgroundColor: 'var(--gray-1)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid var(--gray-6)',
    textAlign: 'center',
    transition: 'all 0.2s'
  }

  const statStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--gray-6)'
  }

  if (!account) {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            background: 'linear-gradient(135deg, var(--blue-9), var(--blue-11))',
            borderRadius: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--blue-contrast)',
            fontSize: '60px',
            fontWeight: 'bold',
            margin: '0 auto 32px'
          }}>
            ⚡
          </div>
          
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, var(--blue-9), var(--blue-11))',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}>
            Welcome to Web3 CRYB
          </h1>
          
          <p style={{
            fontSize: '20px',
            color: 'var(--gray-11)',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Connect your wallet to access advanced Web3 features, earn rewards, trade NFTs, and participate in DAO governance.
          </p>
          
          <button onClick={() => setShowWalletModal(true)} style={buttonStyle}>
            🚀 Connect Wallet
          </button>

          <div style={{ marginTop: '48px', padding: '24px', backgroundColor: 'var(--gray-2)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: 'var(--gray-12)' }}>
              Web3 Features Available
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {[
                { icon: '🪙', title: 'CRYB Token Rewards', desc: 'Earn tokens for creating content and engaging with the community' },
                { icon: '🖼️', title: 'NFT Marketplace', desc: 'Buy, sell, and trade exclusive CRYB NFTs with advanced auction features' },
                { icon: '🏛️', title: 'DAO Governance', desc: 'Vote on platform proposals and shape the future of CRYB' },
                { icon: '💰', title: 'DeFi Integration', desc: 'Stake tokens, provide liquidity, and earn yield from DeFi protocols' }
              ].map((feature, index) => (
                <div key={index} style={{
                  padding: '20px',
                  backgroundColor: 'var(--gray-1)',
                  borderRadius: '12px',
                  border: '1px solid var(--gray-6)',
                  textAlign: 'left'
                }}>
                  <div style={{ fontSize: isMobile ? '26px' : isTablet ? '24px' : '24px', marginBottom: '12px' }}>{feature.icon}</div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--gray-12)' }}>
                    {feature.title}
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--gray-11)', lineHeight: '1.4' }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={gradientCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '24px' : isTablet ? '22px' : '22px', fontWeight: 'bold', marginBottom: '8px' }}>
                Web3 Dashboard
              </h1>
              <p style={{ opacity: 0.9 }}>
                Manage your CRYB tokens, NFTs, and participate in the decentralized ecosystem
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {formatAddress(account)}
              </div>
              <button onClick={disconnect} style={{
                ...secondaryButtonStyle,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white'
              }}>
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Network Status */}
        {!isCorrectNetwork && (
          <div style={{
            ...cardStyle,
            backgroundColor: 'var(--red-3)',
            color: 'var(--red-11)',
            border: '1px solid var(--red-6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  ⚠️ Unsupported Network
                </h3>
                <p style={{ fontSize: '14px' }}>
                  You're connected to {getCurrentNetwork().name}. Please switch to a supported network.
                </p>
              </div>
              <button
                onClick={() => switchNetwork(1)}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'var(--red-9)',
                  color: 'white'
                }}
              >
                Switch to Ethereum
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Wallet Overview */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--gray-12)' }}>
              💳 Wallet Overview
            </h2>
            
            <div style={statStyle}>
              <span style={{ color: 'var(--gray-11)' }}>Network</span>
              <span style={{ fontWeight: '600', color: 'var(--gray-12)' }}>
                {getCurrentNetwork().name}
              </span>
            </div>
            
            <div style={statStyle}>
              <span style={{ color: 'var(--gray-11)' }}>ETH Balance</span>
              <span style={{ fontWeight: '600', color: 'var(--gray-12)' }}>
                {parseFloat(balance).toFixed(4)} {getCurrentNetwork().symbol}
              </span>
            </div>
            
            <div style={{ ...statStyle, borderBottom: 'none' }}>
              <span style={{ color: 'var(--gray-11)' }}>CRYB Balance</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '600', color: 'var(--gray-12)' }}>
                  {parseFloat(cribBalance).toLocaleString()} CRYB
                </span>
                <button
                  onClick={handleAddCribToken}
                  style={{
                    ...secondaryButtonStyle,
                    padding: '4px 8px',
                    fontSize: '12px'
                  }}
                >
                  Add to Wallet
                </button>
              </div>
            </div>
          </div>

          {/* Staking */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--gray-12)' }}>
              🏆 Staking & Rewards
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--gray-11)', fontSize: '14px' }}>
                Stake CRYB Tokens
              </label>
              <input
                type="number"
                value={stakingAmount}
                onChange={(e) => setStakingAmount(e.target.value)}
                placeholder="Enter amount to stake"
                style={inputStyle}
              />
            </div>
            
            <button
              onClick={handleStake}
              disabled={isLoading}
              style={{
                ...buttonStyle,
                width: '100%',
                marginBottom: '16px',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? '⏳ Staking...' : '🚀 Stake Tokens'}
            </button>
            
            <div style={statStyle}>
              <span style={{ color: 'var(--gray-11)' }}>Rewards Earned</span>
              <span style={{ fontWeight: '600', color: 'var(--green-11)' }}>
                {rewardsEarned} CRYB
              </span>
            </div>
            
            <button
              onClick={handleClaimRewards}
              disabled={isLoading || parseFloat(rewardsEarned) === 0}
              style={{
                ...secondaryButtonStyle,
                width: '100%',
                opacity: isLoading || parseFloat(rewardsEarned) === 0 ? 0.5 : 1
              }}
            >
              {isLoading ? '⏳ Claiming...' : '💰 Claim Rewards'}
            </button>
          </div>

          {/* NFT Collection */}
          <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--gray-12)' }}>
              🖼️ Your NFT Collection
            </h2>
            
            {nftCollection.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-11)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
                <p>No NFTs found in your wallet</p>
                <button style={buttonStyle} onClick={() => alert('Navigate to marketplace')}>
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {nftCollection.map((nft) => (
                  <div key={nft.id} style={nftCardStyle}>
                    <img
                      src={nft.image}
                      alt={nft.name}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}
                    />
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--gray-12)' }}>
                      {nft.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--gray-11)' }}>
                      <div>Rarity: {nft.traits.rarity}</div>
                      <div>Power: {nft.traits.power}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Signing */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--gray-12)' }}>
              ✍️ Message Signing
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--gray-11)', fontSize: '14px' }}>
                Message to Sign
              </label>
              <textarea
                value={messageToSign}
                onChange={(e) => setMessageToSign(e.target.value)}
                placeholder="Enter message to sign with your wallet"
                style={{
                  ...inputStyle,
                  height: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <button
              onClick={handleSignMessage}
              style={{
                ...buttonStyle,
                width: '100%',
                marginBottom: '16px'
              }}
            >
              ✍️ Sign Message
            </button>
            
            {signedMessage && (
              <div style={{
                backgroundColor: 'var(--green-3)',
                border: '1px solid var(--green-6)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: 'var(--green-11)',
                wordBreak: 'break-all'
              }}>
                <strong>Signature:</strong><br />
                {signedMessage}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: 'var(--gray-12)' }}>
              ⚡ Quick Actions
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                style={buttonStyle}
                onClick={() => alert('Navigate to marketplace')}
              >
                🛒 Visit Marketplace
              </button>
              
              <button
                style={secondaryButtonStyle}
                onClick={() => alert('Navigate to governance')}
              >
                🏛️ DAO Governance
              </button>
              
              <button
                style={secondaryButtonStyle}
                onClick={() => alert('Navigate to yield farming')}
              >
                🌾 Yield Farming
              </button>
              
              <button
                style={secondaryButtonStyle}
                onClick={() => alert('Navigate to liquidity pools')}
              >
                💧 Liquidity Pools
              </button>
            </div>
          </div>
        </div>
      </div>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  )
}



export default Web3Dashboard