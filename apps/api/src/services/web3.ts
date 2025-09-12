import { CryptoManager } from '@cryb/web3';

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue?: number;
}

export interface NFTMetadata {
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: any;
  }>;
}

export interface WalletPortfolio {
  address: string;
  totalUsdValue: number;
  tokens: TokenBalance[];
  nfts: NFTMetadata[];
  lastUpdated: Date;
}

export class Web3Service {
  private cryptoManager: CryptoManager;

  constructor() {
    this.cryptoManager = new CryptoManager({
      infuraApiKey: process.env.INFURA_API_KEY || '',
      alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
      moralisApiKey: process.env.MORALIS_API_KEY || '',
      etherscanApiKey: process.env.ETHERSCAN_API_KEY || ''
    });
  }

  /**
   * Verify wallet ownership using Sign-in with Ethereum (SIWE)
   */
  async verifyWalletOwnership(message: string, signature: string, address: string): Promise<boolean> {
    try {
      return await this.cryptoManager.verifySIWESignature(message, signature, address);
    } catch (error) {
      console.error('Failed to verify wallet ownership:', error);
      return false;
    }
  }

  /**
   * Get wallet token balances
   */
  async getWalletTokens(address: string, chains: string[] = ['ethereum']): Promise<TokenBalance[]> {
    try {
      const tokens: TokenBalance[] = [];
      
      for (const chain of chains) {
        try {
          const chainTokens = await this.cryptoManager.getTokenBalances(address, chain);
          tokens.push(...chainTokens.map(token => ({
            address: token.contractAddress,
            symbol: token.symbol,
            name: token.name,
            balance: token.balance,
            decimals: token.decimals,
            usdValue: token.usdPrice ? parseFloat(token.balance) * token.usdPrice : undefined
          })));
        } catch (chainError) {
          console.warn(`Failed to get tokens for ${chain}:`, chainError);
        }
      }

      return tokens;
    } catch (error) {
      console.error('Failed to get wallet tokens:', error);
      return [];
    }
  }

  /**
   * Get wallet NFTs
   */
  async getWalletNFTs(address: string, chains: string[] = ['ethereum']): Promise<NFTMetadata[]> {
    try {
      const nfts: NFTMetadata[] = [];
      
      for (const chain of chains) {
        try {
          const chainNFTs = await this.cryptoManager.getNFTs(address, chain);
          nfts.push(...chainNFTs.map(nft => ({
            tokenId: nft.tokenId,
            contractAddress: nft.contractAddress,
            name: nft.name,
            description: nft.description,
            image: nft.imageUrl,
            attributes: nft.attributes
          })));
        } catch (chainError) {
          console.warn(`Failed to get NFTs for ${chain}:`, chainError);
        }
      }

      return nfts;
    } catch (error) {
      console.error('Failed to get wallet NFTs:', error);
      return [];
    }
  }

  /**
   * Get complete wallet portfolio
   */
  async getWalletPortfolio(address: string): Promise<WalletPortfolio | null> {
    try {
      const supportedChains = ['ethereum', 'polygon', 'bsc', 'arbitrum'];
      
      const [tokens, nfts] = await Promise.all([
        this.getWalletTokens(address, supportedChains),
        this.getWalletNFTs(address, supportedChains)
      ]);

      const totalUsdValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);

      return {
        address,
        totalUsdValue,
        tokens,
        nfts,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get wallet portfolio:', error);
      return null;
    }
  }

  /**
   * Check if wallet meets token-gating requirements
   */
  async checkTokenGating(address: string, requirements: any): Promise<boolean> {
    try {
      const portfolio = await this.getWalletPortfolio(address);
      if (!portfolio) return false;

      // Check minimum token balance requirements
      if (requirements.minTokenBalance) {
        const hasRequiredTokens = requirements.minTokenBalance.some((req: any) => {
          const token = portfolio.tokens.find(t => 
            t.address.toLowerCase() === req.contractAddress.toLowerCase()
          );
          return token && parseFloat(token.balance) >= req.minBalance;
        });

        if (!hasRequiredTokens) return false;
      }

      // Check NFT ownership requirements
      if (requirements.requiredNFTs) {
        const hasRequiredNFTs = requirements.requiredNFTs.some((req: any) => {
          return portfolio.nfts.some(nft => 
            nft.contractAddress.toLowerCase() === req.contractAddress.toLowerCase()
          );
        });

        if (!hasRequiredNFTs) return false;
      }

      // Check minimum portfolio value
      if (requirements.minPortfolioValue && portfolio.totalUsdValue < requirements.minPortfolioValue) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check token gating:', error);
      return false;
    }
  }

  /**
   * Get token price information
   */
  async getTokenPrice(contractAddress: string, chain: string = 'ethereum'): Promise<number | null> {
    try {
      const priceData = await this.cryptoManager.getTokenPrice(contractAddress, chain);
      return priceData?.usd || null;
    } catch (error) {
      console.error('Failed to get token price:', error);
      return null;
    }
  }

  /**
   * Validate Ethereum address format
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get ENS name for address (if available)
   */
  async getENSName(address: string): Promise<string | null> {
    try {
      return await this.cryptoManager.resolveENS(address);
    } catch (error) {
      console.error('Failed to resolve ENS:', error);
      return null;
    }
  }

  /**
   * Resolve ENS name to address
   */
  async resolveENS(ensName: string): Promise<string | null> {
    try {
      return await this.cryptoManager.resolveENSToAddress(ensName);
    } catch (error) {
      console.error('Failed to resolve ENS to address:', error);
      return null;
    }
  }

  /**
   * Get transaction history for address
   */
  async getTransactionHistory(address: string, chain: string = 'ethereum', limit: number = 20): Promise<any[]> {
    try {
      return await this.cryptoManager.getTransactionHistory(address, chain, limit);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Check if address has interacted with specific DeFi protocols
   */
  async checkDeFiActivity(address: string): Promise<{
    uniswap: boolean;
    compound: boolean;
    aave: boolean;
    makerdao: boolean;
  }> {
    try {
      const transactions = await this.getTransactionHistory(address, 'ethereum', 100);
      
      // Known contract addresses for major DeFi protocols
      const protocols = {
        uniswap: ['0x7a250d5630b4cf539739df2c5dacb4c659f2488d', '0xe592427a0aece92de3edee1f18e0157c05861564'],
        compound: ['0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b'],
        aave: ['0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9'],
        makerdao: ['0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2']
      };

      const activity = {
        uniswap: false,
        compound: false,
        aave: false,
        makerdao: false
      };

      for (const tx of transactions) {
        const toAddress = tx.to?.toLowerCase();
        
        if (protocols.uniswap.some(addr => addr === toAddress)) activity.uniswap = true;
        if (protocols.compound.some(addr => addr === toAddress)) activity.compound = true;
        if (protocols.aave.some(addr => addr === toAddress)) activity.aave = true;
        if (protocols.makerdao.some(addr => addr === toAddress)) activity.makerdao = true;
      }

      return activity;
    } catch (error) {
      console.error('Failed to check DeFi activity:', error);
      return { uniswap: false, compound: false, aave: false, makerdao: false };
    }
  }

  /**
   * Generate SIWE message for wallet connection
   */
  generateSIWEMessage(address: string, domain: string, nonce: string): string {
    const message = `${domain} wants you to sign in with your Ethereum account:
${address}

Welcome to CRYB! Please sign this message to verify your wallet ownership.

URI: https://${domain}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

    return message;
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): Array<{ id: string; name: string; symbol: string }> {
    return [
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
      { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
      { id: 'bsc', name: 'Binance Smart Chain', symbol: 'BNB' },
      { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
      { id: 'optimism', name: 'Optimism', symbol: 'ETH' },
      { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' }
    ];
  }

  /**
   * Calculate user's Web3 reputation score
   */
  async calculateWeb3Reputation(address: string): Promise<number> {
    try {
      const [portfolio, defiActivity, transactions] = await Promise.all([
        this.getWalletPortfolio(address),
        this.checkDeFiActivity(address),
        this.getTransactionHistory(address, 'ethereum', 50)
      ]);

      let score = 0;

      // Portfolio value (max 40 points)
      if (portfolio) {
        score += Math.min(portfolio.totalUsdValue / 1000 * 10, 40);
        
        // NFT ownership (max 20 points)
        score += Math.min(portfolio.nfts.length * 2, 20);
        
        // Token diversity (max 15 points)
        score += Math.min(portfolio.tokens.length * 1.5, 15);
      }

      // DeFi activity (max 20 points)
      const defiCount = Object.values(defiActivity).filter(Boolean).length;
      score += defiCount * 5;

      // Transaction history (max 5 points)
      score += Math.min(transactions.length / 10, 5);

      return Math.min(Math.round(score), 100);
    } catch (error) {
      console.error('Failed to calculate Web3 reputation:', error);
      return 0;
    }
  }
}