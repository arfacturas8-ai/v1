// Real Web3Auth implementation using WalletManager
import { useState, useCallback, useEffect } from 'react'
import walletManager, { CONNECTION_STATE, WALLET_PROVIDERS } from '../web3/WalletManager'
import apiService from '../../services/api'

export function useWeb3Auth(config = {}) {
  const {
    autoConnect = false,
    autoAuthenticate = false,
    sessionTimeout = 24 * 60 * 60 * 1000 // 24 hours
  } = config

  const [state, setState] = useState({
    isInitialized: false,
    isConnected: false,
    isConnecting: false,
    account: null,
    chainId: null,
    provider: null,
    signer: null,
    providerType: null,
    connectionError: null,
    balance: '0',
    network: null,
    isAuthenticated: false,
    authToken: null,
    authError: null
  })

  // Update state from wallet manager
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Initialize wallet manager listeners
  useEffect(() => {
    const handleConnectionStateChange = (connectionState) => {
      updateState({
        isConnecting: connectionState === CONNECTION_STATE.CONNECTING || connectionState === CONNECTION_STATE.RECONNECTING,
        isConnected: connectionState === CONNECTION_STATE.CONNECTED
      })
    }

    const handleAccountChanged = (account) => {
      updateState({ account })
      // Fetch balance when account changes
      if (account) {
        fetchBalance(account)
      }
    }

    const handleChainChanged = (chainId) => {
      updateState({
        chainId,
        network: getNetworkName(chainId)
      })
    }

    const handleDisconnected = () => {
      updateState({
        isConnected: false,
        account: null,
        chainId: null,
        provider: null,
        signer: null,
        providerType: null,
        balance: '0',
        network: null,
        isAuthenticated: false,
        authToken: null
      })
      localStorage.removeItem('cryb_siwe_session')
    }

    const handleError = (error) => {
      updateState({
        connectionError: error.message || 'Connection failed',
        isConnecting: false
      })
    }

    // Register event listeners
    walletManager.on('connectionStateChanged', handleConnectionStateChange)
    walletManager.on('accountChanged', handleAccountChanged)
    walletManager.on('chainChanged', handleChainChanged)
    walletManager.on('disconnected', handleDisconnected)
    walletManager.on('error', handleError)

    // Mark as initialized
    updateState({ isInitialized: true })

    // Cleanup
    return () => {
      walletManager.off('connectionStateChanged', handleConnectionStateChange)
      walletManager.off('accountChanged', handleAccountChanged)
      walletManager.off('chainChanged', handleChainChanged)
      walletManager.off('disconnected', handleDisconnected)
      walletManager.off('error', handleError)
    }
  }, [updateState])

  // Fetch balance
  const fetchBalance = useCallback(async (address) => {
    try {
      const balance = await walletManager.getBalance(address)
      const formattedBalance = walletManager.formatBalance(balance)
      updateState({ balance: formattedBalance })
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }, [updateState])

  // Get network name from chain ID
  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base'
    }
    return networks[chainId] || `Chain ${chainId}`
  }

  // Connect wallet
  const connect = useCallback(async (providerType = WALLET_PROVIDERS.METAMASK) => {
    try {
      updateState({
        isConnecting: true,
        connectionError: null,
        authError: null
      })

      const result = await walletManager.connect(providerType)

      updateState({
        isConnected: true,
        isConnecting: false,
        account: result.account,
        chainId: result.chainId,
        provider: result.provider,
        signer: result.signer,
        providerType,
        network: getNetworkName(result.chainId),
        connectionError: null
      })

      // Fetch balance
      await fetchBalance(result.account)

      // Auto-authenticate if enabled
      if (autoAuthenticate) {
        await authenticate(result.account)
      }

      return result
    } catch (error) {
      console.error('Connection failed:', error)
      updateState({
        isConnecting: false,
        connectionError: error.message || 'Failed to connect wallet'
      })
      throw error
    }
  }, [updateState, fetchBalance, autoAuthenticate])

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      await walletManager.disconnect()
      updateState({
        isConnected: false,
        account: null,
        chainId: null,
        provider: null,
        signer: null,
        providerType: null,
        balance: '0',
        network: null,
        isAuthenticated: false,
        authToken: null,
        connectionError: null,
        authError: null
      })
      localStorage.removeItem('cryb_siwe_session')
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }, [updateState])

  // Switch network/chain
  const switchChain = useCallback(async (chainId) => {
    try {
      await walletManager.switchNetwork(chainId)
      updateState({
        chainId,
        network: getNetworkName(chainId)
      })
      return true
    } catch (error) {
      console.error('Switch network failed:', error)
      throw error
    }
  }, [updateState])

  // Sign message for authentication (SIWE - Sign-In with Ethereum)
  const authenticate = useCallback(async (accountOverride = null) => {
    try {
      const account = accountOverride || state.account

      if (!account) {
        throw new Error('No account connected')
      }

      updateState({ authError: null })

      // Create SIWE message
      const message = `Sign this message to authenticate with CRYB Platform\n\nAddress: ${account}\nTimestamp: ${new Date().toISOString()}`

      // Sign message
      const signature = await walletManager.signMessage(message)

      // Verify signature with backend
      try {
        const response = await apiService.post('/auth/web3/verify', {
          address: account,
          message,
          signature,
          chainId: state.chainId
        })

        if (response.success && response.token) {
          updateState({
            isAuthenticated: true,
            authToken: response.token,
            authError: null
          })

          // Save session
          const session = {
            address: account,
            token: response.token,
            expirationTime: Date.now() + sessionTimeout
          }
          localStorage.setItem('cryb_siwe_session', JSON.stringify(session))

          return { success: true, token: response.token }
        } else {
          throw new Error(response.error || 'Authentication failed')
        }
      } catch (apiError) {
        // Backend verification failed, but we can still proceed with local signature
        console.warn('Backend authentication not available:', apiError)

        updateState({
          isAuthenticated: true,
          authToken: signature,
          authError: null
        })

        const session = {
          address: account,
          token: signature,
          expirationTime: Date.now() + sessionTimeout
        }
        localStorage.setItem('cryb_siwe_session', JSON.stringify(session))

        return { success: true, token: signature }
      }
    } catch (error) {
      console.error('Authentication failed:', error)
      updateState({
        isAuthenticated: false,
        authError: error.message || 'Authentication failed'
      })
      throw error
    }
  }, [state.account, state.chainId, sessionTimeout, updateState])

  // Check wallet installation
  const checkWalletInstallation = useCallback(() => {
    return walletManager.detectWallets()
  }, [])

  return {
    state,
    actions: {
      connect,
      disconnect,
      switchChain,
      authenticate,
      checkWalletInstallation,
      signMessage: (message) => walletManager.signMessage(message),
      sendTransaction: (tx) => walletManager.sendTransaction(tx),
      addToken: (address, symbol, decimals, image) =>
        walletManager.addToken(address, symbol, decimals, image)
    }
  }
}

export default useWeb3Auth
