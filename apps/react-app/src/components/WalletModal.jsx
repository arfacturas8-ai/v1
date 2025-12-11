import React, { useState } from 'react'
import { useWeb3 } from '../Web3Provider'
import { useResponsive } from '../hooks/useResponsive'

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
      className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md sm:max-w-lg bg-gray-900 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] px-4 sm:px-6 py-4 sm:py-6"
        onClick={e => e.stopPropagation()}
      >
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>

        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white m-0">
              Connect Wallet
            </h2>
            <p className="mt-1 text-sm sm:text-base text-gray-400">
              Connect your wallet to access Web3 features
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-xl sm:text-2xl cursor-pointer text-gray-400 p-1 rounded-lg flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-200 px-4 py-3 rounded-xl border border-red-500/30 mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {walletOptions.map((wallet) => (
            <div
              key={wallet.id}
              className={`flex items-center p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all relative ${
                selectedWallet === wallet.id
                  ? 'border-blue-500 bg-blue-500/10 -translate-y-0.5'
                  : 'border-white/10 bg-gray-800/60 hover:border-blue-500/50 hover:bg-blue-500/5'
              }`}
              onClick={() => wallet.installed ? handleWalletConnect(wallet) : handleInstallWallet(wallet.id)}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 border border-white/10 text-2xl flex-shrink-0">
                {wallet.icon}
              </div>

              <div className="flex-1 ml-4 min-w-0">
                <div className="text-sm sm:text-base font-semibold text-white truncate">
                  {wallet.name}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">
                  {wallet.description}
                </div>
              </div>

              {!wallet.installed ? (
                <button className="bg-blue-600 text-white border-none rounded-lg px-4 py-2 text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors min-h-[44px]">
                  Install
                </button>
              ) : selectedWallet === wallet.id && isConnecting ? (
                <div className="absolute top-4 right-4 w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full "></div>
              ) : (
                <div className={`w-2 h-2 rounded-full ${wallet.installed ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-xs sm:text-sm text-gray-400 text-center space-y-2">
          <p>
            By connecting a wallet, you agree to CRYB's{' '}
            <span className="text-blue-400 cursor-pointer hover:text-blue-300">Terms of Service</span>{' '}
            and{' '}
            <span className="text-blue-400 cursor-pointer hover:text-blue-300">Privacy Policy</span>
          </p>
          <p>
            New to Web3?{' '}
            <span
              className="text-blue-400 cursor-pointer underline hover:text-blue-300"
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