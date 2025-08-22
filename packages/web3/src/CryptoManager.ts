import { CryptoConfig, CryptoWallet, WalletType, Transaction } from './types';
import { MetaMaskProvider } from './wallets/MetaMaskProvider';
import { WalletConnectProvider } from './wallets/WalletConnectProvider';
import { InfuraProvider } from './providers/InfuraProvider';
import { BlockCypherClient } from './providers/BlockCypherClient';
import { MoralisClient } from './nft/MoralisClient';
import { CoingeckoClient } from './providers/CoingeckoClient';
import { TransakClient } from './payments/TransakClient';

export class CryptoManager {
  private infuraProvider?: InfuraProvider;
  private blockCypherClient?: BlockCypherClient;
  private moralisClient?: MoralisClient;
  private coingeckoClient?: CoingeckoClient;
  private transakClient?: TransakClient;
  private metaMaskProvider?: MetaMaskProvider;
  private walletConnectProvider?: WalletConnectProvider;
  private currentWallet?: CryptoWallet;

  constructor(private config: CryptoConfig) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (this.config.infura) {
      this.infuraProvider = new InfuraProvider(
        this.config.infura.apiKey,
        'mainnet'
      );
    }

    if (this.config.blockCypher) {
      this.blockCypherClient = new BlockCypherClient(
        this.config.blockCypher.token
      );
    }

    if (this.config.moralis) {
      this.moralisClient = new MoralisClient(
        this.config.moralis.apiKey
      );
    }

    this.coingeckoClient = new CoingeckoClient(
      this.config.coingecko?.apiKey
    );

    if (this.config.transak) {
      this.transakClient = new TransakClient(
        this.config.transak.apiKey,
        this.config.transak.environment
      );
    }

    if (typeof window !== 'undefined') {
      this.metaMaskProvider = new MetaMaskProvider();
      
      if (this.config.walletConnect) {
        this.walletConnectProvider = new WalletConnectProvider(
          this.config.walletConnect.projectId
        );
      }
    }
  }

  // Universal wallet connection
  async connectWallet(type: WalletType): Promise<CryptoWallet> {
    switch (type) {
      case 'metamask':
        if (!this.metaMaskProvider) {
          throw new Error('MetaMask provider not initialized');
        }
        this.currentWallet = await this.metaMaskProvider.connect();
        return this.currentWallet;

      case 'walletconnect':
        if (!this.walletConnectProvider) {
          throw new Error('WalletConnect provider not initialized');
        }
        this.currentWallet = await this.walletConnectProvider.connect();
        return this.currentWallet;

      case 'coinbase':
        // TODO: Implement Coinbase wallet
        throw new Error('Coinbase wallet not yet implemented');

      default:
        throw new Error(`Unsupported wallet type: ${type}`);
    }
  }

  // Disconnect wallet
  async disconnectWallet(): Promise<void> {
    if (!this.currentWallet) return;

    switch (this.currentWallet.type) {
      case 'metamask':
        await this.metaMaskProvider?.disconnect();
        break;
      case 'walletconnect':
        await this.walletConnectProvider?.disconnect();
        break;
    }

    this.currentWallet = undefined;
  }

  // Get current wallet
  getCurrentWallet(): CryptoWallet | undefined {
    return this.currentWallet;
  }

  // Multi-chain balance checking
  async getWalletBalance(
    address: string,
    networks: string[]
  ): Promise<{ totalUsd: number; byNetwork: any[] }> {
    const balances = await Promise.all(
      networks.map(network => this.getNetworkBalance(address, network))
    );

    return {
      totalUsd: balances.reduce((sum, balance) => sum + (balance.usdValue || 0), 0),
      byNetwork: balances
    };
  }

  // Get balance for specific network
  private async getNetworkBalance(
    address: string,
    network: string
  ): Promise<any> {
    switch (network) {
      case 'ethereum':
      case 'polygon':
      case 'arbitrum':
        if (!this.infuraProvider) {
          throw new Error('Infura provider not initialized');
        }
        const balance = await this.infuraProvider.getBalance(address);
        const price = await this.coingeckoClient?.getCurrentPrices(
          [network === 'ethereum' ? 'ethereum' : network],
          ['usd']
        );
        return {
          network,
          balance,
          usdValue: parseFloat(balance) * (price?.[network]?.usd || 0)
        };

      case 'bitcoin':
        if (!this.blockCypherClient) {
          throw new Error('BlockCypher client not initialized');
        }
        const btcInfo = await this.blockCypherClient.getAddress(address);
        const btcPrice = await this.blockCypherClient.getCurrentPrice();
        return {
          network: 'bitcoin',
          balance: btcInfo.balance / 100000000, // Convert satoshis to BTC
          usdValue: (btcInfo.balance / 100000000) * btcPrice
        };

      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  // Transaction monitoring
  async monitorTransaction(
    txHash: string,
    network: string
  ): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const tx = await this.getTransaction(txHash, network);
          if (tx.status === 'confirmed' || tx.status === 'failed') {
            clearInterval(interval);
            resolve(tx);
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 5000); // Check every 5 seconds

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Transaction monitoring timeout'));
      }, 600000);
    });
  }

  // Get transaction details
  private async getTransaction(
    txHash: string,
    network: string
  ): Promise<Transaction> {
    // Implementation depends on network
    if (network === 'bitcoin') {
      if (!this.blockCypherClient) {
        throw new Error('BlockCypher client not initialized');
      }
      return this.blockCypherClient.getTransaction(txHash);
    } else {
      if (!this.infuraProvider) {
        throw new Error('Infura provider not initialized');
      }
      return this.infuraProvider.getTransaction(txHash);
    }
  }

  // Sign message
  async signMessage(message: string): Promise<string> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }

    switch (this.currentWallet.type) {
      case 'metamask':
        return this.metaMaskProvider!.signMessage(message);
      case 'walletconnect':
        return this.walletConnectProvider!.signMessage(message);
      default:
        throw new Error('Wallet does not support message signing');
    }
  }

  // Get price data
  async getPrices(
    coins: string[],
    currencies: string[] = ['usd']
  ): Promise<any> {
    if (!this.coingeckoClient) {
      throw new Error('CoinGecko client not initialized');
    }
    return this.coingeckoClient.getCurrentPrices(coins, currencies);
  }

  // Get NFTs for an address
  async getNFTs(address: string, chain: string = 'eth'): Promise<any[]> {
    if (!this.moralisClient) {
      throw new Error('Moralis client not initialized');
    }
    return this.moralisClient.getNFTsByOwner(address, chain);
  }

  // Initialize payment widget
  async initializePayment(config: any): Promise<any> {
    if (!this.transakClient) {
      throw new Error('Transak client not initialized');
    }
    return this.transakClient.createWidget(config);
  }

  // Getters for individual providers
  getInfuraProvider(): InfuraProvider | undefined {
    return this.infuraProvider;
  }

  getMoralisClient(): MoralisClient | undefined {
    return this.moralisClient;
  }

  getCoingeckoClient(): CoingeckoClient | undefined {
    return this.coingeckoClient;
  }

  getTransakClient(): TransakClient | undefined {
    return this.transakClient;
  }
}