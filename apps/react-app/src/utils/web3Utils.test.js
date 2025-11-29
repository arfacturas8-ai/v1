// Comprehensive tests for web3Utils.js
import {
  SUPPORTED_WALLETS,
  SUPPORTED_NETWORKS,
  TOKEN_STANDARDS,
  CRYB_TOKEN,
  MOCK_USER_DATA,
  WEB3_FEATURES,
  EDUCATION_CATEGORIES,
  WEB3_ICONS,
  ROADMAP_PHASES,
  formatWalletAddress,
  formatTokenAmount,
  formatUSDValue,
  calculateAPY,
  generateTxHash,
  isValidEthereumAddress,
  getNetworkByChainId,
  getSupportedWallets,
  calculateTokenDistribution,
  simulateWalletConnection,
  simulateTransaction,
  getFeatureStatusColor,
  getComplexityColor
} from './web3Utils.js'

describe('web3Utils', () => {

  // ==========================================
  // Address Validation and Formatting Tests
  // ==========================================

  describe('formatWalletAddress', () => {
    it('should format a valid Ethereum address with default parameters', () => {
      const address = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F'
      const result = formatWalletAddress(address)
      expect(result).toBe('0x742d...8E8F')
    })

    it('should format a valid Ethereum address with custom start and end characters', () => {
      const address = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F'
      const result = formatWalletAddress(address, 8, 6)
      expect(result).toBe('0x742d35...b8E8F')
    })

    it('should handle short addresses', () => {
      const address = '0x1234567890'
      const result = formatWalletAddress(address, 6, 4)
      expect(result).toBe('0x1234...7890')
    })

    it('should return empty string for null address', () => {
      const result = formatWalletAddress(null)
      expect(result).toBe('')
    })

    it('should return empty string for undefined address', () => {
      const result = formatWalletAddress(undefined)
      expect(result).toBe('')
    })

    it('should return empty string for empty string address', () => {
      const result = formatWalletAddress('')
      expect(result).toBe('')
    })

    it('should handle addresses with different casing', () => {
      const address = '0XABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD'
      const result = formatWalletAddress(address)
      expect(result).toBe('0XABCD...ABCD')
    })
  })

  describe('isValidEthereumAddress', () => {
    it('should validate a correct Ethereum address', () => {
      const validAddress = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F'
      expect(isValidEthereumAddress(validAddress)).toBe(true)
    })

    it('should validate an all lowercase Ethereum address', () => {
      const validAddress = '0x742d35cc6a2c4e8f8a8f8a8c9b8e8f8a8c9b8e8f'
      expect(isValidEthereumAddress(validAddress)).toBe(true)
    })

    it('should validate an all uppercase Ethereum address', () => {
      const validAddress = '0x742D35CC6A2C4E8F8A8F8A8C9B8E8F8A8C9B8E8F'
      expect(isValidEthereumAddress(validAddress)).toBe(true)
    })

    it('should reject address without 0x prefix', () => {
      const invalidAddress = '742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F'
      expect(isValidEthereumAddress(invalidAddress)).toBe(false)
    })

    it('should reject address that is too short', () => {
      const invalidAddress = '0x742d35CC6a2C4E8f'
      expect(isValidEthereumAddress(invalidAddress)).toBe(false)
    })

    it('should reject address that is too long', () => {
      const invalidAddress = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F00'
      expect(isValidEthereumAddress(invalidAddress)).toBe(false)
    })

    it('should reject address with invalid characters', () => {
      const invalidAddress = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8EZZ'
      expect(isValidEthereumAddress(invalidAddress)).toBe(false)
    })

    it('should reject null address', () => {
      expect(isValidEthereumAddress(null)).toBe(false)
    })

    it('should reject undefined address', () => {
      expect(isValidEthereumAddress(undefined)).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidEthereumAddress('')).toBe(false)
    })

    it('should reject random string', () => {
      expect(isValidEthereumAddress('not-an-address')).toBe(false)
    })
  })

  // ==========================================
  // Token Amount Formatting Tests
  // ==========================================

  describe('formatTokenAmount', () => {
    it('should format token amount with default decimals (18)', () => {
      const amount = '1000000000000000000' // 1 token with 18 decimals
      const result = formatTokenAmount(amount)
      expect(result).toBe('1')
    })

    it('should format token amount with custom decimals', () => {
      const amount = '1000000' // 1 token with 6 decimals
      const result = formatTokenAmount(amount, 6, 2)
      expect(result).toBe('1')
    })

    it('should format token amount with display decimals', () => {
      const amount = '1500000000000000000' // 1.5 tokens
      const result = formatTokenAmount(amount, 18, 2)
      expect(result).toBe('1.5')
    })

    it('should format large token amounts with thousands separator', () => {
      const amount = '1000000000000000000000' // 1000 tokens
      const result = formatTokenAmount(amount, 18, 2)
      expect(result).toBe('1,000')
    })

    it('should handle fractional amounts', () => {
      const amount = '123456789000000000' // 0.123456789 tokens
      const result = formatTokenAmount(amount, 18, 4)
      expect(result).toBe('0.1235')
    })

    it('should return "0" for null amount', () => {
      const result = formatTokenAmount(null)
      expect(result).toBe('0')
    })

    it('should return "0" for undefined amount', () => {
      const result = formatTokenAmount(undefined)
      expect(result).toBe('0')
    })

    it('should return "0" for empty string amount', () => {
      const result = formatTokenAmount('')
      expect(result).toBe('0')
    })

    it('should return "0" for zero amount', () => {
      const result = formatTokenAmount('0', 18, 2)
      expect(result).toBe('0')
    })

    it('should handle very small amounts', () => {
      const amount = '1' // 0.000000000000000001 tokens
      const result = formatTokenAmount(amount, 18, 8)
      expect(result).toBe('0')
    })

    it('should handle custom display decimals with rounding', () => {
      const amount = '1234567890000000000' // 1.23456789 tokens
      const result = formatTokenAmount(amount, 18, 3)
      expect(result).toBe('1.235')
    })
  })

  // ==========================================
  // USD Value Formatting Tests
  // ==========================================

  describe('formatUSDValue', () => {
    it('should format USD value with default formatting', () => {
      const result = formatUSDValue(100)
      expect(result).toBe('$100.00')
    })

    it('should format large USD values with thousands separator', () => {
      const result = formatUSDValue(1000000)
      expect(result).toBe('$1,000,000.00')
    })

    it('should format fractional USD values', () => {
      const result = formatUSDValue(123.456)
      expect(result).toBe('$123.46')
    })

    it('should format small USD values', () => {
      const result = formatUSDValue(0.99)
      expect(result).toBe('$0.99')
    })

    it('should return "$0.00" for null value', () => {
      const result = formatUSDValue(null)
      expect(result).toBe('$0.00')
    })

    it('should return "$0.00" for undefined value', () => {
      const result = formatUSDValue(undefined)
      expect(result).toBe('$0.00')
    })

    it('should return "$0.00" for zero value', () => {
      const result = formatUSDValue(0)
      expect(result).toBe('$0.00')
    })

    it('should handle negative values', () => {
      const result = formatUSDValue(-50.25)
      expect(result).toBe('-$50.25')
    })

    it('should round to two decimal places', () => {
      const result = formatUSDValue(123.456789)
      expect(result).toBe('$123.46')
    })
  })

  // ==========================================
  // APY Calculation Tests
  // ==========================================

  describe('calculateAPY', () => {
    it('should calculate APY with default periods (365)', () => {
      const principal = 1000
      const rate = 0.12 // 12%
      const apy = calculateAPY(principal, rate)
      expect(apy).toBeCloseTo(127.47, 1) // ~12.7% APY
    })

    it('should calculate APY with custom compounding periods', () => {
      const principal = 1000
      const rate = 0.10 // 10%
      const periods = 12 // Monthly compounding
      const apy = calculateAPY(principal, rate, periods)
      expect(apy).toBeCloseTo(104.71, 1) // ~10.5% APY
    })

    it('should return 0 for 0% rate', () => {
      const principal = 1000
      const rate = 0
      const apy = calculateAPY(principal, rate)
      expect(apy).toBe(0)
    })

    it('should handle small principals', () => {
      const principal = 1
      const rate = 0.05
      const apy = calculateAPY(principal, rate)
      expect(apy).toBeCloseTo(0.0513, 3)
    })

    it('should handle large principals', () => {
      const principal = 1000000
      const rate = 0.15
      const apy = calculateAPY(principal, rate)
      expect(apy).toBeGreaterThan(160000)
    })

    it('should handle high APR rates', () => {
      const principal = 1000
      const rate = 1.0 // 100% APR
      const apy = calculateAPY(principal, rate)
      expect(apy).toBeGreaterThan(1500) // Compounding effect
    })

    it('should handle daily compounding', () => {
      const principal = 1000
      const rate = 0.10
      const periods = 365
      const apy = calculateAPY(principal, rate, periods)
      expect(apy).toBeCloseTo(105.16, 1)
    })
  })

  // ==========================================
  // Transaction Hash Generation Tests
  // ==========================================

  describe('generateTxHash', () => {
    it('should generate a valid transaction hash format', () => {
      const txHash = generateTxHash()
      expect(txHash).toMatch(/^0x[a-f0-9]{64}$/)
    })

    it('should generate unique transaction hashes', () => {
      const txHash1 = generateTxHash()
      const txHash2 = generateTxHash()
      expect(txHash1).not.toBe(txHash2)
    })

    it('should always start with 0x', () => {
      const txHash = generateTxHash()
      expect(txHash.startsWith('0x')).toBe(true)
    })

    it('should have correct length (66 characters)', () => {
      const txHash = generateTxHash()
      expect(txHash.length).toBe(66) // 0x + 64 hex chars
    })

    it('should only contain valid hex characters', () => {
      const txHash = generateTxHash()
      const hexPart = txHash.substring(2)
      expect(/^[0-9a-f]+$/.test(hexPart)).toBe(true)
    })

    it('should generate multiple unique hashes', () => {
      const hashes = new Set()
      for (let i = 0; i < 100; i++) {
        hashes.add(generateTxHash())
      }
      expect(hashes.size).toBe(100)
    })
  })

  // ==========================================
  // Network Utilities Tests
  // ==========================================

  describe('getNetworkByChainId', () => {
    it('should return Ethereum network for chain ID 1', () => {
      const network = getNetworkByChainId(1)
      expect(network).toBeDefined()
      expect(network.name).toBe('Ethereum Mainnet')
      expect(network.symbol).toBe('ETH')
    })

    it('should return Polygon network for chain ID 137', () => {
      const network = getNetworkByChainId(137)
      expect(network).toBeDefined()
      expect(network.name).toBe('Polygon')
      expect(network.symbol).toBe('MATIC')
    })

    it('should return BSC network for chain ID 56', () => {
      const network = getNetworkByChainId(56)
      expect(network).toBeDefined()
      expect(network.name).toBe('Binance Smart Chain')
      expect(network.symbol).toBe('BNB')
    })

    it('should return Arbitrum network for chain ID 42161', () => {
      const network = getNetworkByChainId(42161)
      expect(network).toBeDefined()
      expect(network.name).toBe('Arbitrum One')
      expect(network.symbol).toBe('ETH')
    })

    it('should return undefined for unknown chain ID', () => {
      const network = getNetworkByChainId(99999)
      expect(network).toBeUndefined()
    })

    it('should return undefined for null chain ID', () => {
      const network = getNetworkByChainId(null)
      expect(network).toBeUndefined()
    })

    it('should return undefined for undefined chain ID', () => {
      const network = getNetworkByChainId(undefined)
      expect(network).toBeUndefined()
    })

    it('should handle negative chain IDs', () => {
      const network = getNetworkByChainId(-1)
      expect(network).toBeUndefined()
    })
  })

  describe('getSupportedWallets', () => {
    it('should return only supported wallets', () => {
      const wallets = getSupportedWallets()
      expect(wallets.length).toBeGreaterThan(0)
      wallets.forEach(wallet => {
        expect(wallet.supported).toBe(true)
      })
    })

    it('should include MetaMask', () => {
      const wallets = getSupportedWallets()
      const metamask = wallets.find(w => w.id === 'metamask')
      expect(metamask).toBeDefined()
      expect(metamask.name).toBe('MetaMask')
    })

    it('should include WalletConnect', () => {
      const wallets = getSupportedWallets()
      const walletConnect = wallets.find(w => w.id === 'walletconnect')
      expect(walletConnect).toBeDefined()
      expect(walletConnect.name).toBe('WalletConnect')
    })

    it('should include Coinbase Wallet', () => {
      const wallets = getSupportedWallets()
      const coinbase = wallets.find(w => w.id === 'coinbase')
      expect(coinbase).toBeDefined()
      expect(coinbase.name).toBe('Coinbase Wallet')
    })

    it('should not include unsupported wallets', () => {
      const wallets = getSupportedWallets()
      const phantom = wallets.find(w => w.id === 'phantom')
      const trust = wallets.find(w => w.id === 'trust')
      expect(phantom).toBeUndefined()
      expect(trust).toBeUndefined()
    })

    it('should return array of wallet objects with required properties', () => {
      const wallets = getSupportedWallets()
      wallets.forEach(wallet => {
        expect(wallet).toHaveProperty('id')
        expect(wallet).toHaveProperty('name')
        expect(wallet).toHaveProperty('description')
        expect(wallet).toHaveProperty('downloadUrl')
        expect(wallet).toHaveProperty('supported')
      })
    })
  })

  // ==========================================
  // Token Distribution Tests
  // ==========================================

  describe('calculateTokenDistribution', () => {
    it('should return token distribution array', () => {
      const distribution = calculateTokenDistribution()
      expect(Array.isArray(distribution)).toBe(true)
      expect(distribution.length).toBe(5)
    })

    it('should include all distribution categories', () => {
      const distribution = calculateTokenDistribution()
      const categories = distribution.map(d => d.category)
      expect(categories).toContain('community')
      expect(categories).toContain('team')
      expect(categories).toContain('ecosystem')
      expect(categories).toContain('treasury')
      expect(categories).toContain('publicSale')
    })

    it('should have correct percentages that sum to 100', () => {
      const distribution = calculateTokenDistribution()
      const totalPercentage = distribution.reduce((sum, d) => sum + d.percentage, 0)
      expect(totalPercentage).toBe(100)
    })

    it('should include community allocation of 40%', () => {
      const distribution = calculateTokenDistribution()
      const community = distribution.find(d => d.category === 'community')
      expect(community.percentage).toBe(40)
      expect(community.amount).toBe('400000000')
    })

    it('should include team allocation of 20%', () => {
      const distribution = calculateTokenDistribution()
      const team = distribution.find(d => d.category === 'team')
      expect(team.percentage).toBe(20)
      expect(team.amount).toBe('200000000')
    })

    it('should include ecosystem allocation of 15%', () => {
      const distribution = calculateTokenDistribution()
      const ecosystem = distribution.find(d => d.category === 'ecosystem')
      expect(ecosystem.percentage).toBe(15)
      expect(ecosystem.amount).toBe('150000000')
    })

    it('should have descriptions for each category', () => {
      const distribution = calculateTokenDistribution()
      distribution.forEach(d => {
        expect(d.description).toBeDefined()
        expect(typeof d.description).toBe('string')
        expect(d.description.length).toBeGreaterThan(0)
      })
    })

    it('should have valid amounts for each category', () => {
      const distribution = calculateTokenDistribution()
      distribution.forEach(d => {
        expect(d.amount).toBeDefined()
        expect(typeof d.amount).toBe('string')
        expect(parseInt(d.amount)).toBeGreaterThan(0)
      })
    })
  })

  // ==========================================
  // Async Wallet Connection Simulation Tests
  // ==========================================

  describe('simulateWalletConnection', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should resolve with success after default delay', async () => {
      const promise = simulateWalletConnection('metamask')
      jest.advanceTimersByTime(2000)
      const result = await promise

      expect(result.success).toBe(true)
      expect(result.address).toBeDefined()
      expect(result.network).toBe('ethereum')
      expect(result.balance).toBeDefined()
    })

    it('should resolve with custom delay', async () => {
      const promise = simulateWalletConnection('walletconnect', 1000)
      jest.advanceTimersByTime(1000)
      const result = await promise

      expect(result.success).toBe(true)
    })

    it('should return mock user address', async () => {
      const promise = simulateWalletConnection('metamask')
      jest.advanceTimersByTime(2000)
      const result = await promise

      expect(result.address).toBe(MOCK_USER_DATA.wallet.address)
    })

    it('should return mock user balance', async () => {
      const promise = simulateWalletConnection('metamask')
      jest.advanceTimersByTime(2000)
      const result = await promise

      expect(result.balance).toEqual(MOCK_USER_DATA.wallet.balance)
      expect(result.balance.eth).toBe('2.45')
      expect(result.balance.cryb).toBe('1250.00')
      expect(result.balance.usdc).toBe('500.00')
    })

    it('should work with different wallet types', async () => {
      const walletTypes = ['metamask', 'walletconnect', 'coinbase']

      for (const walletType of walletTypes) {
        const promise = simulateWalletConnection(walletType)
        jest.advanceTimersByTime(2000)
        const result = await promise
        expect(result.success).toBe(true)
      }
    })
  })

  // ==========================================
  // Async Transaction Simulation Tests
  // ==========================================

  describe('simulateTransaction', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should resolve with success after default delay', async () => {
      const promise = simulateTransaction('transfer', '1.0', '0x123...')
      jest.advanceTimersByTime(3000)
      const result = await promise

      expect(result.success).toBe(true)
    })

    it('should return transaction details', async () => {
      const promise = simulateTransaction('transfer', '1.5', '0xRecipient')
      jest.advanceTimersByTime(3000)
      const result = await promise

      expect(result.type).toBe('transfer')
      expect(result.amount).toBe('1.5')
      expect(result.recipient).toBe('0xRecipient')
      expect(result.txHash).toBeDefined()
      expect(result.gasUsed).toBeDefined()
      expect(result.gasFee).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should generate valid transaction hash', async () => {
      const promise = simulateTransaction('send', '2.0', '0xAddr')
      jest.advanceTimersByTime(3000)
      const result = await promise

      expect(result.txHash).toMatch(/^0x[a-f0-9]{64}$/)
    })

    it('should generate gas values within expected range', async () => {
      const promise = simulateTransaction('transfer', '1.0', '0x123')
      jest.advanceTimersByTime(3000)
      const result = await promise

      expect(result.gasUsed).toBeGreaterThanOrEqual(21000)
      expect(result.gasUsed).toBeLessThanOrEqual(71000)
    })

    it('should generate gas fee in ETH format', async () => {
      const promise = simulateTransaction('transfer', '1.0', '0x123')
      jest.advanceTimersByTime(3000)
      const result = await promise

      expect(result.gasFee).toMatch(/^\d+\.\d{6} ETH$/)
    })

    it('should include valid timestamp', async () => {
      const promise = simulateTransaction('transfer', '1.0', '0x123')
      jest.advanceTimersByTime(3000)
      const result = await promise

      expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date')
    })

    it('should work with custom delay', async () => {
      const promise = simulateTransaction('swap', '5.0', '0xDEX', 1000)
      jest.advanceTimersByTime(1000)
      const result = await promise

      expect(result.success).toBe(true)
      expect(result.type).toBe('swap')
    })

    it('should handle different transaction types', async () => {
      const types = ['transfer', 'swap', 'stake', 'approve']

      for (const type of types) {
        const promise = simulateTransaction(type, '1.0', '0x123')
        jest.advanceTimersByTime(3000)
        const result = await promise
        expect(result.type).toBe(type)
      }
    })
  })

  // ==========================================
  // UI Helper Function Tests
  // ==========================================

  describe('getFeatureStatusColor', () => {
    it('should return success color for Phase 1', () => {
      expect(getFeatureStatusColor('Phase 1')).toBe('text-success')
    })

    it('should return warning color for Phase 2', () => {
      expect(getFeatureStatusColor('Phase 2')).toBe('text-warning')
    })

    it('should return info color for Phase 3', () => {
      expect(getFeatureStatusColor('Phase 3')).toBe('text-info')
    })

    it('should return accent-light color for Phase 4', () => {
      expect(getFeatureStatusColor('Phase 4')).toBe('text-accent-light')
    })

    it('should return muted color for unknown status', () => {
      expect(getFeatureStatusColor('Unknown')).toBe('text-muted')
    })

    it('should return muted color for null status', () => {
      expect(getFeatureStatusColor(null)).toBe('text-muted')
    })

    it('should return muted color for undefined status', () => {
      expect(getFeatureStatusColor(undefined)).toBe('text-muted')
    })
  })

  describe('getComplexityColor', () => {
    it('should return success colors for Low complexity', () => {
      expect(getComplexityColor('Low')).toBe('bg-success/20 text-success')
    })

    it('should return warning colors for Medium complexity', () => {
      expect(getComplexityColor('Medium')).toBe('bg-warning/20 text-warning')
    })

    it('should return error colors for High complexity', () => {
      expect(getComplexityColor('High')).toBe('bg-error/20 text-error')
    })

    it('should return error colors for Very High complexity', () => {
      expect(getComplexityColor('Very High')).toBe('bg-error/30 text-error')
    })

    it('should return muted colors for unknown complexity', () => {
      expect(getComplexityColor('Unknown')).toBe('bg-muted/20 text-muted')
    })

    it('should return muted colors for null complexity', () => {
      expect(getComplexityColor(null)).toBe('bg-muted/20 text-muted')
    })

    it('should return muted colors for undefined complexity', () => {
      expect(getComplexityColor(undefined)).toBe('bg-muted/20 text-muted')
    })
  })

  // ==========================================
  // Constants and Data Structure Tests
  // ==========================================

  describe('SUPPORTED_WALLETS', () => {
    it('should have MetaMask configuration', () => {
      expect(SUPPORTED_WALLETS.METAMASK).toBeDefined()
      expect(SUPPORTED_WALLETS.METAMASK.id).toBe('metamask')
      expect(SUPPORTED_WALLETS.METAMASK.supported).toBe(true)
    })

    it('should have WalletConnect configuration', () => {
      expect(SUPPORTED_WALLETS.WALLET_CONNECT).toBeDefined()
      expect(SUPPORTED_WALLETS.WALLET_CONNECT.id).toBe('walletconnect')
      expect(SUPPORTED_WALLETS.WALLET_CONNECT.supported).toBe(true)
    })

    it('should have Coinbase Wallet configuration', () => {
      expect(SUPPORTED_WALLETS.COINBASE_WALLET).toBeDefined()
      expect(SUPPORTED_WALLETS.COINBASE_WALLET.id).toBe('coinbase')
      expect(SUPPORTED_WALLETS.COINBASE_WALLET.supported).toBe(true)
    })

    it('should mark Phantom as unsupported', () => {
      expect(SUPPORTED_WALLETS.PHANTOM.supported).toBe(false)
    })

    it('should mark Trust Wallet as unsupported', () => {
      expect(SUPPORTED_WALLETS.TRUST_WALLET.supported).toBe(false)
    })

    it('should have mobile and desktop support flags', () => {
      Object.values(SUPPORTED_WALLETS).forEach(wallet => {
        expect(wallet).toHaveProperty('mobile')
        expect(wallet).toHaveProperty('desktop')
      })
    })
  })

  describe('SUPPORTED_NETWORKS', () => {
    it('should have Ethereum mainnet configuration', () => {
      expect(SUPPORTED_NETWORKS.ETHEREUM).toBeDefined()
      expect(SUPPORTED_NETWORKS.ETHEREUM.chainId).toBe(1)
      expect(SUPPORTED_NETWORKS.ETHEREUM.supported).toBe(true)
    })

    it('should have Polygon configuration', () => {
      expect(SUPPORTED_NETWORKS.POLYGON).toBeDefined()
      expect(SUPPORTED_NETWORKS.POLYGON.chainId).toBe(137)
      expect(SUPPORTED_NETWORKS.POLYGON.supported).toBe(false)
    })

    it('should have BSC configuration', () => {
      expect(SUPPORTED_NETWORKS.BSC).toBeDefined()
      expect(SUPPORTED_NETWORKS.BSC.chainId).toBe(56)
      expect(SUPPORTED_NETWORKS.BSC.supported).toBe(false)
    })

    it('should have Arbitrum configuration', () => {
      expect(SUPPORTED_NETWORKS.ARBITRUM).toBeDefined()
      expect(SUPPORTED_NETWORKS.ARBITRUM.chainId).toBe(42161)
      expect(SUPPORTED_NETWORKS.ARBITRUM.supported).toBe(false)
    })

    it('should have required network properties', () => {
      Object.values(SUPPORTED_NETWORKS).forEach(network => {
        expect(network).toHaveProperty('chainId')
        expect(network).toHaveProperty('name')
        expect(network).toHaveProperty('symbol')
        expect(network).toHaveProperty('rpcUrl')
        expect(network).toHaveProperty('explorerUrl')
      })
    })
  })

  describe('TOKEN_STANDARDS', () => {
    it('should have ERC20 standard', () => {
      expect(TOKEN_STANDARDS.ERC20).toBeDefined()
      expect(TOKEN_STANDARDS.ERC20.name).toBe('ERC-20')
      expect(TOKEN_STANDARDS.ERC20.examples).toContain('CRYB')
    })

    it('should have ERC721 standard', () => {
      expect(TOKEN_STANDARDS.ERC721).toBeDefined()
      expect(TOKEN_STANDARDS.ERC721.name).toBe('ERC-721')
      expect(TOKEN_STANDARDS.ERC721.description).toContain('Non-fungible')
    })

    it('should have ERC1155 standard', () => {
      expect(TOKEN_STANDARDS.ERC1155).toBeDefined()
      expect(TOKEN_STANDARDS.ERC1155.name).toBe('ERC-1155')
      expect(TOKEN_STANDARDS.ERC1155.description).toContain('Multi-token')
    })
  })

  describe('CRYB_TOKEN', () => {
    it('should have basic token information', () => {
      expect(CRYB_TOKEN.name).toBe('CRYB Token')
      expect(CRYB_TOKEN.symbol).toBe('CRYB')
      expect(CRYB_TOKEN.decimals).toBe(18)
      expect(CRYB_TOKEN.standard).toBe('ERC-20')
    })

    it('should have total supply of 1 billion', () => {
      expect(CRYB_TOKEN.totalSupply).toBe('1000000000')
    })

    it('should have feature flags', () => {
      expect(CRYB_TOKEN.features.burnable).toBe(true)
      expect(CRYB_TOKEN.features.mintable).toBe(false)
      expect(CRYB_TOKEN.features.pausable).toBe(true)
      expect(CRYB_TOKEN.features.governance).toBe(true)
      expect(CRYB_TOKEN.features.staking).toBe(true)
    })

    it('should have distribution categories', () => {
      expect(CRYB_TOKEN.distribution.community).toBeDefined()
      expect(CRYB_TOKEN.distribution.team).toBeDefined()
      expect(CRYB_TOKEN.distribution.ecosystem).toBeDefined()
      expect(CRYB_TOKEN.distribution.treasury).toBeDefined()
      expect(CRYB_TOKEN.distribution.publicSale).toBeDefined()
    })

    it('should have utility array', () => {
      expect(Array.isArray(CRYB_TOKEN.utilities)).toBe(true)
      expect(CRYB_TOKEN.utilities.length).toBeGreaterThan(0)
      expect(CRYB_TOKEN.utilities).toContain('Governance voting')
      expect(CRYB_TOKEN.utilities).toContain('Staking rewards')
    })
  })

  describe('MOCK_USER_DATA', () => {
    it('should have wallet information', () => {
      expect(MOCK_USER_DATA.wallet).toBeDefined()
      expect(MOCK_USER_DATA.wallet.connected).toBe(false)
      expect(MOCK_USER_DATA.wallet.address).toBeDefined()
      expect(isValidEthereumAddress(MOCK_USER_DATA.wallet.address)).toBe(true)
    })

    it('should have balance information', () => {
      expect(MOCK_USER_DATA.wallet.balance.eth).toBe('2.45')
      expect(MOCK_USER_DATA.wallet.balance.cryb).toBe('1250.00')
      expect(MOCK_USER_DATA.wallet.balance.usdc).toBe('500.00')
    })

    it('should have NFT collection', () => {
      expect(Array.isArray(MOCK_USER_DATA.nfts)).toBe(true)
      expect(MOCK_USER_DATA.nfts.length).toBe(3)
      MOCK_USER_DATA.nfts.forEach(nft => {
        expect(nft).toHaveProperty('id')
        expect(nft).toHaveProperty('name')
        expect(nft).toHaveProperty('collection')
        expect(nft).toHaveProperty('rarity')
        expect(nft).toHaveProperty('value')
      })
    })

    it('should have DeFi positions', () => {
      expect(MOCK_USER_DATA.defi).toBeDefined()
      expect(MOCK_USER_DATA.defi.totalValue).toBe('$12543.21')
      expect(Array.isArray(MOCK_USER_DATA.defi.positions)).toBe(true)
      expect(MOCK_USER_DATA.defi.positions.length).toBe(3)
    })

    it('should have governance information', () => {
      expect(MOCK_USER_DATA.governance).toBeDefined()
      expect(MOCK_USER_DATA.governance.votingPower).toBe('1250 CRYB')
      expect(MOCK_USER_DATA.governance.votesParticipated).toBe(12)
      expect(MOCK_USER_DATA.governance.proposalsCreated).toBe(2)
    })
  })

  describe('WEB3_FEATURES', () => {
    it('should have wallet integration feature', () => {
      expect(WEB3_FEATURES.WALLET_INTEGRATION).toBeDefined()
      expect(WEB3_FEATURES.WALLET_INTEGRATION.status).toBe('Phase 1')
    })

    it('should have NFT system feature', () => {
      expect(WEB3_FEATURES.NFT_SYSTEM).toBeDefined()
      expect(WEB3_FEATURES.NFT_SYSTEM.status).toBe('Phase 2')
    })

    it('should have token gating feature', () => {
      expect(WEB3_FEATURES.TOKEN_GATING).toBeDefined()
      expect(WEB3_FEATURES.TOKEN_GATING.status).toBe('Phase 2')
    })

    it('should have DeFi integration feature', () => {
      expect(WEB3_FEATURES.DEFI_INTEGRATION).toBeDefined()
      expect(WEB3_FEATURES.DEFI_INTEGRATION.status).toBe('Phase 3')
    })

    it('should have DAO governance feature', () => {
      expect(WEB3_FEATURES.DAO_GOVERNANCE).toBeDefined()
      expect(WEB3_FEATURES.DAO_GOVERNANCE.status).toBe('Phase 4')
    })

    it('should have complexity ratings', () => {
      Object.values(WEB3_FEATURES).forEach(feature => {
        expect(feature).toHaveProperty('complexity')
        expect(['Low', 'Medium', 'High', 'Very High']).toContain(feature.complexity)
      })
    })
  })

  describe('EDUCATION_CATEGORIES', () => {
    it('should have basics category', () => {
      expect(EDUCATION_CATEGORIES.BASICS).toBeDefined()
      expect(EDUCATION_CATEGORIES.BASICS.difficulty).toBe('Beginner')
    })

    it('should have wallets category', () => {
      expect(EDUCATION_CATEGORIES.WALLETS).toBeDefined()
      expect(EDUCATION_CATEGORIES.WALLETS.difficulty).toBe('Beginner')
    })

    it('should have NFTs category', () => {
      expect(EDUCATION_CATEGORIES.NFTS).toBeDefined()
      expect(EDUCATION_CATEGORIES.NFTS.difficulty).toBe('Intermediate')
    })

    it('should have DeFi category', () => {
      expect(EDUCATION_CATEGORIES.DEFI).toBeDefined()
      expect(EDUCATION_CATEGORIES.DEFI.difficulty).toBe('Advanced')
    })

    it('should have governance category', () => {
      expect(EDUCATION_CATEGORIES.GOVERNANCE).toBeDefined()
      expect(EDUCATION_CATEGORIES.GOVERNANCE.difficulty).toBe('Intermediate')
    })

    it('should have topics for each category', () => {
      Object.values(EDUCATION_CATEGORIES).forEach(category => {
        expect(Array.isArray(category.topics)).toBe(true)
        expect(category.topics.length).toBeGreaterThan(0)
      })
    })
  })

  describe('WEB3_ICONS', () => {
    it('should have wallet icon', () => {
      expect(WEB3_ICONS.WALLET).toBe('👛')
    })

    it('should have NFT icon', () => {
      expect(WEB3_ICONS.NFT).toBe('🖼️')
    })

    it('should have token icon', () => {
      expect(WEB3_ICONS.TOKEN).toBe('🪙')
    })

    it('should have status icons', () => {
      expect(WEB3_ICONS.SUCCESS).toBe('✅')
      expect(WEB3_ICONS.WARNING).toBe('⚠️')
      expect(WEB3_ICONS.ERROR).toBe('❌')
      expect(WEB3_ICONS.LOADING).toBe('⏳')
    })

    it('should have blockchain icons', () => {
      expect(WEB3_ICONS.ETHEREUM).toBe('⟠')
      expect(WEB3_ICONS.BITCOIN).toBe('₿')
    })
  })

  describe('ROADMAP_PHASES', () => {
    it('should have Phase 1 configuration', () => {
      expect(ROADMAP_PHASES.PHASE_1).toBeDefined()
      expect(ROADMAP_PHASES.PHASE_1.title).toBe('Foundation')
      expect(ROADMAP_PHASES.PHASE_1.timeline).toBe('Q2 2024')
    })

    it('should have Phase 2 configuration', () => {
      expect(ROADMAP_PHASES.PHASE_2).toBeDefined()
      expect(ROADMAP_PHASES.PHASE_2.title).toBe('Social Features')
      expect(ROADMAP_PHASES.PHASE_2.timeline).toBe('Q3 2024')
    })

    it('should have Phase 3 configuration', () => {
      expect(ROADMAP_PHASES.PHASE_3).toBeDefined()
      expect(ROADMAP_PHASES.PHASE_3.title).toBe('DeFi Integration')
      expect(ROADMAP_PHASES.PHASE_3.timeline).toBe('Q4 2024')
    })

    it('should have Phase 4 configuration', () => {
      expect(ROADMAP_PHASES.PHASE_4).toBeDefined()
      expect(ROADMAP_PHASES.PHASE_4.title).toBe('Ecosystem Growth')
      expect(ROADMAP_PHASES.PHASE_4.timeline).toBe('Q1 2025')
    })

    it('should have features for each phase', () => {
      Object.values(ROADMAP_PHASES).forEach(phase => {
        expect(Array.isArray(phase.features)).toBe(true)
        expect(phase.features.length).toBeGreaterThan(0)
      })
    })
  })

  // ==========================================
  // Edge Cases and Error Handling Tests
  // ==========================================

  describe('Edge Cases and Error Handling', () => {
    describe('formatWalletAddress edge cases', () => {
      it('should handle very long start and end parameters', () => {
        const address = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F'
        const result = formatWalletAddress(address, 50, 50)
        expect(result).toContain('...')
      })

      it('should handle zero start and end characters', () => {
        const address = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F'
        const result = formatWalletAddress(address, 0, 0)
        expect(result).toContain('...')
      })

      it('should handle negative start and end characters', () => {
        const address = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F'
        const result = formatWalletAddress(address, -5, -3)
        expect(result).toContain('...')
      })
    })

    describe('formatTokenAmount edge cases', () => {
      it('should handle string with non-numeric characters', () => {
        const result = formatTokenAmount('abc123')
        expect(result).toBe('NaN')
      })

      it('should handle negative amounts', () => {
        const result = formatTokenAmount('-1000000000000000000', 18, 2)
        expect(result).toBe('-1')
      })

      it('should handle very large amounts', () => {
        const amount = '1000000000000000000000000' // 1 million tokens
        const result = formatTokenAmount(amount, 18, 2)
        expect(result).toContain('1,000,000')
      })

      it('should handle zero decimals parameter', () => {
        const amount = '1000000'
        const result = formatTokenAmount(amount, 0, 2)
        expect(result).toBe('1,000,000')
      })
    })

    describe('calculateAPY edge cases', () => {
      it('should handle zero principal', () => {
        const apy = calculateAPY(0, 0.1, 365)
        expect(apy).toBe(0)
      })

      it('should handle negative rate', () => {
        const apy = calculateAPY(1000, -0.05, 365)
        expect(apy).toBeLessThan(0)
      })

      it('should handle single compounding period', () => {
        const apy = calculateAPY(1000, 0.1, 1)
        expect(apy).toBe(100)
      })

      it('should handle fractional periods', () => {
        const apy = calculateAPY(1000, 0.1, 12.5)
        expect(apy).toBeCloseTo(104, 0)
      })
    })

    describe('isValidEthereumAddress edge cases', () => {
      it('should handle address with special characters', () => {
        expect(isValidEthereumAddress('0x742d35CC6a2C4E8f@#$%')).toBe(false)
      })

      it('should handle address with spaces', () => {
        expect(isValidEthereumAddress('0x742d35CC 6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F')).toBe(false)
      })

      it('should handle ENS names', () => {
        expect(isValidEthereumAddress('vitalik.eth')).toBe(false)
      })

      it('should handle 0X prefix (uppercase X)', () => {
        const address = '0X742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F'
        expect(isValidEthereumAddress(address)).toBe(false)
      })
    })

    describe('getNetworkByChainId edge cases', () => {
      it('should handle string chain ID', () => {
        const network = getNetworkByChainId('1')
        expect(network).toBeUndefined()
      })

      it('should handle float chain ID', () => {
        const network = getNetworkByChainId(1.5)
        expect(network).toBeUndefined()
      })

      it('should handle very large chain ID', () => {
        const network = getNetworkByChainId(Number.MAX_SAFE_INTEGER)
        expect(network).toBeUndefined()
      })
    })
  })

  // ==========================================
  // Integration Tests
  // ==========================================

  describe('Integration Tests', () => {
    it('should format and validate the same address', () => {
      const address = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F'
      expect(isValidEthereumAddress(address)).toBe(true)
      const formatted = formatWalletAddress(address)
      expect(formatted).toContain('0x742d')
    })

    it('should use mock address from MOCK_USER_DATA in validation', () => {
      const address = MOCK_USER_DATA.wallet.address
      expect(isValidEthereumAddress(address)).toBe(true)
    })

    it('should generate transaction hash that passes validation', () => {
      const txHash = generateTxHash()
      expect(txHash).toMatch(/^0x[a-f0-9]{64}$/)
      expect(txHash.length).toBe(66)
    })

    it('should get network and verify its properties', () => {
      const network = getNetworkByChainId(1)
      expect(network).toBeDefined()
      expect(network.name).toBe('Ethereum Mainnet')
      expect(getFeatureStatusColor('Phase 1')).toBe('text-success')
    })

    it('should format token distribution amounts correctly', () => {
      const distribution = calculateTokenDistribution()
      const communityAmount = distribution.find(d => d.category === 'community').amount
      const formatted = formatTokenAmount(communityAmount + '000000000000000000', 18, 0)
      expect(formatted).toContain('400')
    })

    it('should work with all supported wallets and their properties', () => {
      const wallets = getSupportedWallets()
      wallets.forEach(wallet => {
        expect(wallet.id).toBeDefined()
        expect(wallet.name).toBeDefined()
        expect(wallet.downloadUrl).toBeDefined()
      })
    })
  })
})
