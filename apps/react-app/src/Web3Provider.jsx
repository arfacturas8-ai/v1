import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ethers } from 'ethers'

// Web3 Context
const Web3Context = createContext()

// Custom hook to use Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

// Supported networks
const SUPPORTED_NETWORKS = {
  1: {
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://eth.public-rpc.com',
    blockExplorer: 'https://etherscan.io'
  },
  137: {
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  42161: {
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  },
  10: {
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: import.meta.env.VITE_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io'
  },
  56: {
    name: 'BSC Mainnet',
    symbol: 'BNB',
    rpcUrl: import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com'
  }
}

// Contract addresses (environment specific)
const CONTRACT_ADDRESSES = {
  1: {
    CRYB_TOKEN: import.meta.env.VITE_ETH_CRYB_TOKEN || null,
    GOVERNANCE: import.meta.env.VITE_ETH_GOVERNANCE || null,
    STAKING: import.meta.env.VITE_ETH_STAKING || null,
    MARKETPLACE: import.meta.env.VITE_ETH_MARKETPLACE || null,
    REWARDS: import.meta.env.VITE_ETH_REWARDS || null
  },
  137: {
    CRYB_TOKEN: import.meta.env.VITE_POLYGON_CRYB_TOKEN || null,
    GOVERNANCE: import.meta.env.VITE_POLYGON_GOVERNANCE || null,
    STAKING: import.meta.env.VITE_POLYGON_STAKING || null,
    MARKETPLACE: import.meta.env.VITE_POLYGON_MARKETPLACE || null,
    REWARDS: import.meta.env.VITE_POLYGON_REWARDS || null
  }
}

// Wallet types
const WALLET_TYPES = {
  METAMASK: 'metamask',
  WALLET_CONNECT: 'walletconnect',
  COINBASE_WALLET: 'coinbasewallet',
  RAINBOW: 'rainbow'
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [balance, setBalance] = useState('0')
  const [cribBalance, setCribBalance] = useState('0')
  const [connectedWallet, setConnectedWallet] = useState(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  // Initialize Web3
  const initializeWeb3 = useCallback(async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const web3Provider = new ethers.BrowserProvider(window.ethereum)
        setProvider(web3Provider)

        // Auto-connection DISABLED - user must manually connect wallet
        // const signer = await web3Provider.getSigner().catch(() => null)
        // if (signer) {
        //   const address = await signer.getAddress()
        //   const network = await web3Provider.getNetwork()
        //   setAccount(address)
        //   setChainId(Number(network.chainId))
        //   setSigner(signer)
        //   setConnectedWallet(WALLET_TYPES.METAMASK)
        //
        //   await updateBalances(address, web3Provider, Number(network.chainId))
        // }
      }
    } catch (error) {
      console.error('Failed to initialize Web3:', error)
      setError('Failed to initialize Web3')
    }
  }, [])

  // Update user balances
  const updateBalances = useCallback(async (address, web3Provider, networkId) => {
    try {
      // Get ETH balance
      const ethBalance = await web3Provider.getBalance(address)
      setBalance(ethers.formatEther(ethBalance))

      // Get CRYB token balance (if contract exists on this network)
      const contractAddresses = CONTRACT_ADDRESSES[networkId]
      if (contractAddresses && contractAddresses.CRYB_TOKEN) {
        const tokenContract = new ethers.Contract(
          contractAddresses.CRYB_TOKEN,
          [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)'
          ],
          web3Provider
        )

        const tokenBalance = await tokenContract.balanceOf(address)
        const decimals = await tokenContract.decimals()
        setCribBalance(ethers.formatUnits(tokenBalance, decimals))
      }
    } catch (error) {
      console.error('Failed to update balances:', error)
    }
  }, [])

  // Connect to MetaMask
  const connectMetaMask = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return false
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const network = await web3Provider.getNetwork()

      setProvider(web3Provider)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setSigner(await web3Provider.getSigner())
      setConnectedWallet(WALLET_TYPES.METAMASK)

      await updateBalances(accounts[0], web3Provider, Number(network.chainId))

      // Store connection preference
      localStorage.setItem('connectedWallet', WALLET_TYPES.METAMASK)
      localStorage.setItem('walletAddress', accounts[0])

      return true
    } catch (error) {
      console.error('Failed to connect to MetaMask:', error)
      setError(error.message || 'Failed to connect to MetaMask')
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [updateBalances])

  // Connect to WalletConnect
  const connectWalletConnect = useCallback(async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      // WalletConnect v2 implementation would go here
      // For now, show error message
      throw new Error('WalletConnect integration coming soon')
      
    } catch (error) {
      console.error('Failed to connect via WalletConnect:', error)
      setError(error.message || 'Failed to connect via WalletConnect')
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Connect to Coinbase Wallet
  const connectCoinbaseWallet = useCallback(async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      // Coinbase Wallet SDK implementation would go here
      throw new Error('Coinbase Wallet integration coming soon')
      
    } catch (error) {
      console.error('Failed to connect to Coinbase Wallet:', error)
      setError(error.message || 'Failed to connect to Coinbase Wallet')
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Switch network
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) {
      setError('No wallet connected')
      return false
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toQuantity(targetChainId) }]
      })
      return true
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          const network = SUPPORTED_NETWORKS[targetChainId]
          if (!network) {
            throw new Error('Unsupported network')
          }

          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ethers.toQuantity(targetChainId),
              chainName: network.name,
              nativeCurrency: {
                name: network.symbol,
                symbol: network.symbol,
                decimals: 18
              },
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.blockExplorer]
            }]
          })
          return true
        } catch (addError) {
          console.error('Failed to add network:', addError)
          setError('Failed to add network to wallet')
          return false
        }
      } else {
        console.error('Failed to switch network:', error)
        setError('Failed to switch network')
        return false
      }
    }
  }, [])

  // Add token to wallet
  const addTokenToWallet = useCallback(async (tokenAddress, symbol, decimals, image) => {
    if (!window.ethereum) {
      setError('No wallet connected')
      return false
    }

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: decimals,
            image: image
          }
        }
      })
      return true
    } catch (error) {
      console.error('Failed to add token:', error)
      setError('Failed to add token to wallet')
      return false
    }
  }, [])

  // Sign message
  const signMessage = useCallback(async (message) => {
    if (!signer) {
      throw new Error('No signer available')
    }

    try {
      const signature = await signer.signMessage(message)
      return signature
    } catch (error) {
      console.error('Failed to sign message:', error)
      throw new Error('Failed to sign message')
    }
  }, [signer])

  // Sign typed data (EIP-712)
  const signTypedData = useCallback(async (domain, types, value) => {
    if (!signer) {
      throw new Error('No signer available')
    }

    try {
      const signature = await signer._signTypedData(domain, types, value)
      return signature
    } catch (error) {
      console.error('Failed to sign typed data:', error)
      throw new Error('Failed to sign typed data')
    }
  }, [signer])

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setAccount(null)
    setChainId(null)
    setProvider(null)
    setSigner(null)
    setBalance('0')
    setCribBalance('0')
    setConnectedWallet(null)
    setError(null)
    
    // Clear stored connection
    localStorage.removeItem('connectedWallet')
    localStorage.removeItem('walletAddress')
  }, [])

  // Get contract instance
  const getContract = useCallback((contractName, abi) => {
    if (!signer || !chainId) {
      throw new Error('Wallet not connected')
    }

    const addresses = CONTRACT_ADDRESSES[chainId]
    if (!addresses || !addresses[contractName]) {
      throw new Error(`Contract ${contractName} not deployed on this network`)
    }

    return new ethers.Contract(addresses[contractName], abi, signer)
  }, [signer, chainId])

  // Execute transaction with error handling
  const executeTransaction = useCallback(async (txFunction, options = {}) => {
    try {
      const tx = await txFunction()
      
      // Show transaction submitted notification
      if (options.onSubmitted) {
        options.onSubmitted(tx.hash)
      }
      
      // Wait for confirmation
      const receipt = await tx.wait()
      
      // Update balances after transaction
      if (account && provider && chainId) {
        await updateBalances(account, provider, chainId)
      }
      
      return receipt
    } catch (error) {
      console.error('Transaction failed:', error)
      
      // Parse common error messages
      let userFriendlyMessage = 'Transaction failed'
      if (error.code === 4001) {
        userFriendlyMessage = 'Transaction was cancelled by user'
      } else if (error.code === -32603) {
        userFriendlyMessage = 'Transaction failed - insufficient funds or contract error'
      } else if (error.message.includes('insufficient funds')) {
        userFriendlyMessage = 'Insufficient funds for transaction'
      } else if (error.message.includes('gas')) {
        userFriendlyMessage = 'Gas estimation failed - transaction may fail'
      }
      
      if (options.onError) {
        options.onError(userFriendlyMessage)
      }
      
      throw new Error(userFriendlyMessage)
    }
  }, [account, provider, chainId, updateBalances])

  // Handle account changes
  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect()
      } else if (accounts[0] !== account) {
        setAccount(accounts[0])
        if (provider && chainId) {
          updateBalances(accounts[0], provider, chainId)
        }
      }
    }

    const handleChainChanged = (chainId) => {
      const networkId = parseInt(chainId, 16)
      setChainId(networkId)
      setIsCorrectNetwork(SUPPORTED_NETWORKS[networkId] !== undefined)
      
      if (account && provider) {
        updateBalances(account, provider, networkId)
      }
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [account, provider, chainId, disconnect, updateBalances])

  // Check if connected to correct network
  useEffect(() => {
    setIsCorrectNetwork(SUPPORTED_NETWORKS[chainId] !== undefined)
  }, [chainId])

  // Initialize on mount
  useEffect(() => {
    initializeWeb3()
  }, [initializeWeb3])

  // Auto-reconnect on page load (DISABLED - user must manually connect)
  // useEffect(() => {
  //   const storedWallet = localStorage.getItem('connectedWallet')
  //   const storedAddress = localStorage.getItem('walletAddress')
  //
  //   if (storedWallet && storedAddress && !account) {
  //     if (storedWallet === WALLET_TYPES.METAMASK) {
  //       connectMetaMask()
  //     }
  //     // Add other wallet auto-reconnection logic here
  //   }
  // }, [account, connectMetaMask])

  const value = {
    // Connection state
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    error,
    balance,
    cribBalance,
    connectedWallet,
    isCorrectNetwork,
    
    // Connection methods
    connectMetaMask,
    connectWalletConnect,
    connectCoinbaseWallet,
    disconnect,
    
    // Network methods
    switchNetwork,
    addTokenToWallet,
    
    // Transaction methods
    signMessage,
    signTypedData,
    executeTransaction,
    getContract,
    
    // Utilities
    SUPPORTED_NETWORKS,
    CONTRACT_ADDRESSES,
    WALLET_TYPES,
    
    // Clear error
    clearError: () => setError(null)
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}
export default Web3Context
