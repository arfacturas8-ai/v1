// CRYB Platform Cryptocurrency Payment Service
// Integrates with Transak, MoonPay, and direct crypto payments

import { getCRYBTokenContract } from '../lib/contracts/cryb-contracts.js';
import { walletManager } from '../lib/web3/WalletManager.js';
import cryptoPaymentAPI from './cryptoPaymentAPI.js';

// Payment gateway configurations
export const PAYMENT_GATEWAYS = {
  TRANSAK: {
    name: 'Transak',
    testMode: true,
    apiKey: import.meta.env.VITE_TRANSAK_API_KEY || 'test_api_key',
    environment: import.meta.env.MODE === 'production' ? 'PRODUCTION' : 'STAGING',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR', 'CAD'],
    supportedCryptos: ['ETH', 'BTC', 'USDC', 'USDT', 'MATIC'],
    fees: {
      fiat: 0.99, // $0.99 + percentage
      percentage: 0.049 // 4.9%
    }
  },
  MOONPAY: {
    name: 'MoonPay',
    testMode: true,
    apiKey: import.meta.env.VITE_MOONPAY_API_KEY || 'test_api_key',
    environment: import.meta.env.MODE === 'production' ? 'live' : 'sandbox',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    supportedCryptos: ['ETH', 'BTC', 'USDC', 'USDT', 'MATIC', 'AVAX'],
    fees: {
      fiat: 1.99, // $1.99 + percentage
      percentage: 0.045 // 4.5%
    }
  },
  DIRECT_CRYPTO: {
    name: 'Direct Crypto',
    supportedTokens: {
      1: { // Ethereum
        ETH: '0x0000000000000000000000000000000000000000',
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        USDC: '0xA0b86a33E6441ce67780E9Ad5e6FfE49B51ba87C',
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        CRYB: '0x1234567890123456789012345678901234567890'
      },
      137: { // Polygon
        MATIC: '0x0000000000000000000000000000000000000000',
        USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        CRYB: '0x1234567890123456789012345678901234567890'
      }
    },
    fees: {
      percentage: 0.025 // 2.5%
    }
  }
};

// Subscription tiers and pricing
export const SUBSCRIPTION_TIERS = {
  BASIC: {
    id: 'basic',
    name: 'Basic Premium',
    monthlyPriceUSD: 9.99,
    yearlyPriceUSD: 99.99,
    features: [
      'Ad-free experience',
      'Enhanced profile customization',
      'Priority customer support',
      'Early access to features'
    ],
    tokenPrice: {
      CRYB: '10',
      ETH: '0.005',
      USDC: '9.99'
    }
  },
  PRO: {
    id: 'pro',
    name: 'Pro Premium',
    monthlyPriceUSD: 24.99,
    yearlyPriceUSD: 249.99,
    features: [
      'All Basic features',
      'Advanced analytics dashboard',
      'Custom themes and branding',
      'API access',
      'Advanced moderation tools'
    ],
    tokenPrice: {
      CRYB: '25',
      ETH: '0.012',
      USDC: '24.99'
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPriceUSD: 99.99,
    yearlyPriceUSD: 999.99,
    features: [
      'All Pro features',
      'White-label options',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security features'
    ],
    tokenPrice: {
      CRYB: '100',
      ETH: '0.05',
      USDC: '99.99'
    }
  }
};

// Payment types
export const PAYMENT_TYPES = {
  SUBSCRIPTION: 'subscription',
  TIP: 'tip',
  NFT_PURCHASE: 'nft_purchase',
  PREMIUM_ACCESS: 'premium_access',
  DONATION: 'donation',
  BOOST: 'boost'
};

export class CryptoPaymentService {
  constructor() {
    this.transactionHistory = [];
    this.pendingTransactions = new Map();
  }

  // Initialize payment gateways
  async initialize() {
    try {
      // Initialize Transak
      if (typeof window !== 'undefined' && window.transak) {
        this.transakSDK = window.transak;
      }

      // Initialize MoonPay
      if (typeof window !== 'undefined' && window.MoonPaySDK) {
        this.moonPaySDK = window.MoonPaySDK;
      }

    } catch (error) {
      console.error('Failed to initialize payment service:', error);
    }
  }

  // Fiat-to-crypto with Transak
  async buyWithTransak(amount, currency = 'USD', crypto = 'ETH', walletAddress = null) {
    try {
      const config = PAYMENT_GATEWAYS.TRANSAK;
      const userAddress = walletAddress || walletManager.account;
      
      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      const transakConfig = {
        apiKey: config.apiKey,
        environment: config.environment,
        defaultCryptoCurrency: crypto,
        defaultFiatCurrency: currency,
        defaultFiatAmount: amount,
        walletAddress: userAddress,
        themeColor: '#6366f1',
        hostURL: window.location.origin,
        redirectURL: `${window.location.origin}/payment-success`,
        widgetHeight: '600px',
        widgetWidth: '450px'
      };

      // Open Transak widget
      return new Promise((resolve, reject) => {
        const transak = new window.TransakSDK.default(transakConfig);
        
        transak.on('TRANSAK_ORDER_SUCCESSFUL', (orderData) => {
          this.recordTransaction({
            id: orderData.status.id,
            type: 'fiat_to_crypto',
            gateway: 'transak',
            amount: amount,
            currency: currency,
            crypto: crypto,
            status: 'completed',
            timestamp: Date.now(),
            data: orderData
          });
          resolve(orderData);
        });

        transak.on('TRANSAK_ORDER_FAILED', (error) => {
          console.error('Transak order failed:', error);
          reject(error);
        });

        transak.on('TRANSAK_WIDGET_CLOSE', () => {
        });

        transak.init();
      });
    } catch (error) {
      console.error('Transak payment error:', error);
      throw error;
    }
  }

  // Fiat-to-crypto with MoonPay
  async buyWithMoonPay(amount, currency = 'USD', crypto = 'ETH', walletAddress = null) {
    try {
      const config = PAYMENT_GATEWAYS.MOONPAY;
      const userAddress = walletAddress || walletManager.account;
      
      if (!userAddress) {
        throw new Error('Wallet not connected');
      }

      const moonPayConfig = {
        apiKey: config.apiKey,
        environment: config.environment,
        currencyCode: crypto.toLowerCase(),
        baseCurrencyCode: currency.toLowerCase(),
        baseCurrencyAmount: amount,
        walletAddress: userAddress,
        colorCode: '#6366f1',
        redirectURL: `${window.location.origin}/payment-success`,
        showWalletAddressForm: false
      };

      // Generate MoonPay URL
      const baseUrl = config.environment === 'sandbox' 
        ? 'https://buy-sandbox.moonpay.com'
        : 'https://buy.moonpay.com';
        
      const params = new URLSearchParams(moonPayConfig);
      const moonPayUrl = `${baseUrl}?${params.toString()}`;

      // Open MoonPay in new window
      const paymentWindow = window.open(moonPayUrl, 'moonpay', 'width=450,height=600');

      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (paymentWindow.closed) {
            clearInterval(checkClosed);
            // In a real implementation, you'd verify the transaction status
            this.recordTransaction({
              id: `moonpay_${Date.now()}`,
              type: 'fiat_to_crypto',
              gateway: 'moonpay',
              amount: amount,
              currency: currency,
              crypto: crypto,
              status: 'pending',
              timestamp: Date.now()
            });
            resolve({ status: 'payment_window_closed' });
          }
        }, 1000);

        // Timeout after 30 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!paymentWindow.closed) {
            paymentWindow.close();
          }
          reject(new Error('Payment timeout'));
        }, 30 * 60 * 1000);
      });
    } catch (error) {
      console.error('MoonPay payment error:', error);
      throw error;
    }
  }

  // Direct cryptocurrency payments
  async payWithCrypto(token, amount, recipient, paymentType = PAYMENT_TYPES.TIP, metadata = {}) {
    try {
      if (!walletManager.isConnected) {
        throw new Error('Wallet not connected');
      }

      const chainId = walletManager.currentChainId;
      const supportedTokens = PAYMENT_GATEWAYS.DIRECT_CRYPTO.supportedTokens[chainId];
      
      if (!supportedTokens || !supportedTokens[token]) {
        throw new Error(`Token ${token} not supported on this network`);
      }

      const tokenAddress = supportedTokens[token];
      const amountWei = this.parseTokenAmount(amount, 18); // Assuming 18 decimals

      let txHash;

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token (ETH/MATIC) payment
        txHash = await this.sendNativeToken(recipient, amountWei);
      } else {
        // ERC-20 token payment
        txHash = await this.sendERC20Token(tokenAddress, recipient, amountWei);
      }

      const transaction = {
        id: txHash,
        type: paymentType,
        gateway: 'direct_crypto',
        token: token,
        tokenAddress: tokenAddress,
        amount: amount,
        recipient: recipient,
        sender: walletManager.account,
        chainId: chainId,
        status: 'pending',
        timestamp: Date.now(),
        metadata: metadata
      };

      this.recordTransaction(transaction);
      this.pendingTransactions.set(txHash, transaction);

      // Monitor transaction status
      this.monitorTransaction(txHash);

      return {
        transactionHash: txHash,
        transaction: transaction
      };
    } catch (error) {
      console.error('Crypto payment error:', error);
      throw error;
    }
  }

  // Send native token (ETH/MATIC)
  async sendNativeToken(recipient, amount) {
    try {
      const provider = walletManager.provider;
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: recipient,
        value: amount,
        gasLimit: 21000
      });

      return tx.hash;
    } catch (error) {
      console.error('Native token transfer error:', error);
      throw error;
    }
  }

  // Send ERC-20 token
  async sendERC20Token(tokenAddress, recipient, amount) {
    try {
      // In a real implementation, you'd use the actual token contract
      
      // Mock transaction hash
      const mockTxHash = `0x${'erc20'.repeat(16)}`;
      return mockTxHash;
    } catch (error) {
      console.error('ERC-20 token transfer error:', error);
      throw error;
    }
  }

  // Subscribe to premium with crypto
  async subscribeToPremium(tier, duration = 'monthly', paymentMethod = 'CRYB') {
    try {
      const tierConfig = SUBSCRIPTION_TIERS[tier.toUpperCase()];
      if (!tierConfig) {
        throw new Error('Invalid subscription tier');
      }

      const amount = duration === 'yearly' 
        ? tierConfig.tokenPrice[paymentMethod] * 10 // 10 months price for yearly
        : tierConfig.tokenPrice[paymentMethod];

      const recipient = '0xCRYBTreasuryAddress00000000000000000000000'; // Treasury address

      return await this.payWithCrypto(
        paymentMethod,
        amount,
        recipient,
        PAYMENT_TYPES.SUBSCRIPTION,
        {
          tier: tier,
          duration: duration,
          features: tierConfig.features
        }
      );
    } catch (error) {
      console.error('Premium subscription error:', error);
      throw error;
    }
  }

  // Tip users with crypto
  async tipUser(recipientAddress, amount, token = 'CRYB', message = '') {
    try {
      return await this.payWithCrypto(
        token,
        amount,
        recipientAddress,
        PAYMENT_TYPES.TIP,
        {
          message: message,
          timestamp: Date.now()
        }
      );
    } catch (error) {
      console.error('Tip payment error:', error);
      throw error;
    }
  }

  // Purchase NFT with crypto
  async purchaseNFT(nftContract, tokenId, price, paymentToken = 'ETH') {
    try {
      // In a real implementation, this would interact with the marketplace contract
      
      const marketplaceAddress = '0xMarketplaceAddress000000000000000000000000';
      
      return await this.payWithCrypto(
        paymentToken,
        price,
        marketplaceAddress,
        PAYMENT_TYPES.NFT_PURCHASE,
        {
          nftContract: nftContract,
          tokenId: tokenId,
          price: price,
          paymentToken: paymentToken
        }
      );
    } catch (error) {
      console.error('NFT purchase error:', error);
      throw error;
    }
  }

  // Monitor transaction status
  async monitorTransaction(txHash) {
    try {
      const checkStatus = async () => {
        try {
          const receipt = await walletManager.provider.getTransactionReceipt(txHash);
          const transaction = this.pendingTransactions.get(txHash);
          
          if (receipt && transaction) {
            transaction.status = receipt.status === 1 ? 'completed' : 'failed';
            transaction.gasUsed = receipt.gasUsed.toString();
            transaction.blockNumber = receipt.blockNumber;
            
            this.pendingTransactions.delete(txHash);
            this.updateTransactionRecord(txHash, transaction);
            
            // Emit event for UI updates
            this.emitTransactionUpdate(transaction);
          } else if (!receipt) {
            // Transaction still pending, check again in 15 seconds
            setTimeout(checkStatus, 15000);
          }
        } catch (error) {
          console.error('Transaction monitoring error:', error);
          // Retry after 30 seconds
          setTimeout(checkStatus, 30000);
        }
      };

      // Start monitoring
      setTimeout(checkStatus, 5000); // First check after 5 seconds
    } catch (error) {
      console.error('Transaction monitoring setup error:', error);
    }
  }

  // Get payment methods for user
  getAvailablePaymentMethods() {
    const methods = [];

    // Fiat-to-crypto options
    methods.push({
      type: 'fiat_to_crypto',
      provider: 'transak',
      name: 'Credit/Debit Card (Transak)',
      fees: PAYMENT_GATEWAYS.TRANSAK.fees,
      supportedCurrencies: PAYMENT_GATEWAYS.TRANSAK.supportedCurrencies,
      supportedCryptos: PAYMENT_GATEWAYS.TRANSAK.supportedCryptos
    });

    methods.push({
      type: 'fiat_to_crypto',
      provider: 'moonpay',
      name: 'Credit/Debit Card (MoonPay)',
      fees: PAYMENT_GATEWAYS.MOONPAY.fees,
      supportedCurrencies: PAYMENT_GATEWAYS.MOONPAY.supportedCurrencies,
      supportedCryptos: PAYMENT_GATEWAYS.MOONPAY.supportedCryptos
    });

    // Direct crypto payments
    if (walletManager.isConnected) {
      const chainId = walletManager.currentChainId;
      const supportedTokens = PAYMENT_GATEWAYS.DIRECT_CRYPTO.supportedTokens[chainId];
      
      if (supportedTokens) {
        Object.keys(supportedTokens).forEach(token => {
          methods.push({
            type: 'direct_crypto',
            provider: 'wallet',
            name: `Pay with ${token}`,
            token: token,
            fees: PAYMENT_GATEWAYS.DIRECT_CRYPTO.fees
          });
        });
      }
    }

    return methods;
  }

  // Calculate payment fees
  calculateFees(amount, method) {
    const fees = {
      platformFee: 0,
      gatewayFee: 0,
      total: 0
    };

    if (method.type === 'fiat_to_crypto') {
      const gateway = PAYMENT_GATEWAYS[method.provider.toUpperCase()];
      fees.gatewayFee = gateway.fees.fiat + (amount * gateway.fees.percentage);
    } else if (method.type === 'direct_crypto') {
      fees.platformFee = amount * PAYMENT_GATEWAYS.DIRECT_CRYPTO.fees.percentage;
    }

    fees.total = fees.platformFee + fees.gatewayFee;
    return fees;
  }

  // Transaction history management
  async recordTransaction(transaction) {
    // Save to local state first
    this.transactionHistory.unshift(transaction);
    this.saveTransactionHistory();

    // Sync with backend
    try {
      await cryptoPaymentAPI.recordTransaction(transaction);
    } catch (error) {
      console.error('Failed to sync transaction with backend:', error);
      // Continue even if backend fails - local state preserved
    }
  }

  updateTransactionRecord(txHash, updatedTransaction) {
    const index = this.transactionHistory.findIndex(tx => tx.id === txHash);
    if (index !== -1) {
      this.transactionHistory[index] = updatedTransaction;
      this.saveTransactionHistory();
    }
  }

  async getTransactionHistory(limit = 50) {
    // Try to fetch from backend first
    try {
      const response = await cryptoPaymentAPI.getTransactionHistory(limit);
      if (response.success && response.data?.items) {
        // Update local cache with backend data
        this.transactionHistory = response.data.items;
        this.saveTransactionHistory();
        return response.data.items;
      }
    } catch (error) {
      console.error('Failed to fetch from backend, using local cache:', error);
    }

    // Fallback to local cache
    return this.transactionHistory.slice(0, limit);
  }

  getTransactionsByType(type) {
    return this.transactionHistory.filter(tx => tx.type === type);
  }

  saveTransactionHistory() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cryb_transaction_history', JSON.stringify(this.transactionHistory));
      }
    } catch (error) {
      console.error('Failed to save transaction history:', error);
    }
  }

  loadTransactionHistory() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cryb_transaction_history');
        if (stored) {
          this.transactionHistory = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    }
  }

  // Event handling for UI updates
  emitTransactionUpdate(transaction) {
    const event = new CustomEvent('cryptoPaymentUpdate', {
      detail: transaction
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  // Utility functions
  parseTokenAmount(amount, decimals = 18) {
    return BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));
  }

  formatTokenAmount(amount, decimals = 18) {
    return (Number(amount) / (10 ** decimals)).toFixed(6);
  }

  // Get current crypto prices from backend
  async getCryptoPrices() {
    try {
      const response = await cryptoPaymentAPI.getCryptoPrices();
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Failed to fetch prices from backend:', error);
    }

    // Fallback to mock prices
    return {
      ETH: 2450.50,
      BTC: 45120.30,
      MATIC: 0.85,
      USDC: 1.00,
      USDT: 1.00,
      DAI: 1.00,
      CRYB: 1.85
    };
  }

  // Convert between currencies
  async convertCurrency(fromAmount, fromCurrency, toCurrency) {
    const prices = await this.getCryptoPrices();
    
    if (!prices[fromCurrency] || !prices[toCurrency]) {
      throw new Error('Unsupported currency pair');
    }

    const usdAmount = fromAmount * prices[fromCurrency];
    const convertedAmount = usdAmount / prices[toCurrency];
    
    return {
      fromAmount,
      fromCurrency,
      toAmount: convertedAmount,
      toCurrency,
      exchangeRate: prices[fromCurrency] / prices[toCurrency],
      usdValue: usdAmount
    };
  }
}

// Singleton instance
export const cryptoPaymentService = new CryptoPaymentService();

// Initialize on module load
if (typeof window !== 'undefined') {
  cryptoPaymentService.loadTransactionHistory();
  cryptoPaymentService.initialize();
}

export default cryptoPaymentService;