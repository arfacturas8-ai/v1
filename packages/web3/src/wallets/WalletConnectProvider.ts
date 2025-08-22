import { CryptoWallet, WalletProvider } from '../types';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { arbitrum, mainnet, polygon, optimism } from 'viem/chains';

export class WalletConnectProvider implements WalletProvider {
  private projectId: string;
  private web3Modal: any;
  private wagmiConfig: any;
  private currentAccount: string | null = null;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.initializeWalletConnect();
  }

  private initializeWalletConnect(): void {
    const metadata = {
      name: 'CRYB Platform',
      description: 'Next-generation community platform with Web3 integration',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://cryb.com',
      icons: ['https://cryb.com/icon.png']
    };

    const chains = [mainnet, polygon, arbitrum, optimism];
    
    this.wagmiConfig = defaultWagmiConfig({
      chains,
      projectId: this.projectId,
      metadata,
      enableAnalytics: true,
      enableOnramp: true
    });

    if (typeof window !== 'undefined') {
      this.web3Modal = createWeb3Modal({
        wagmiConfig: this.wagmiConfig,
        projectId: this.projectId,
        enableAnalytics: true,
        enableOnramp: true,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-color-mix': '#0052FF',
          '--w3m-color-mix-strength': 40,
          '--w3m-accent': '#00D4FF'
        }
      });
    }
  }

  async connect(): Promise<CryptoWallet> {
    try {
      if (!this.web3Modal) {
        throw new Error('WalletConnect not initialized');
      }

      await this.web3Modal.open();
      
      // Wait for connection
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 60000); // 60 second timeout

        const checkConnection = setInterval(() => {
          const account = this.wagmiConfig.getAccount();
          if (account && account.isConnected && account.address) {
            clearInterval(checkConnection);
            clearTimeout(timeout);
            
            this.currentAccount = account.address;
            
            resolve({
              address: account.address,
              network: this.getNetworkFromChainId(account.chainId),
              type: 'walletconnect',
              chainId: account.chainId,
              isConnected: true
            });
          }
        }, 500);
      });
    } catch (error: any) {
      throw new Error(`WalletConnect connection failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.wagmiConfig) {
      await this.wagmiConfig.disconnect();
      this.currentAccount = null;
    }
    if (this.web3Modal) {
      this.web3Modal.close();
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.currentAccount) {
      throw new Error('No wallet connected');
    }

    const signer = await this.wagmiConfig.getWalletClient();
    if (!signer) {
      throw new Error('No signer available');
    }

    return await signer.signMessage({
      account: this.currentAccount,
      message
    });
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.currentAccount) {
      throw new Error('No wallet connected');
    }

    const signer = await this.wagmiConfig.getWalletClient();
    if (!signer) {
      throw new Error('No signer available');
    }

    const hash = await signer.sendTransaction({
      account: this.currentAccount,
      ...transaction
    });

    return hash;
  }

  async getBalance(address: string): Promise<string> {
    const publicClient = await this.wagmiConfig.getPublicClient();
    if (!publicClient) {
      throw new Error('No public client available');
    }

    const balance = await publicClient.getBalance({ address });
    return balance.toString();
  }

  isInstalled(): boolean {
    // WalletConnect doesn't require installation
    return true;
  }

  onAccountChanged(callback: (accounts: string[]) => void): void {
    if (this.wagmiConfig) {
      this.wagmiConfig.subscribe(
        (state: any) => state.account,
        (account: any) => {
          if (account?.address) {
            callback([account.address]);
          } else {
            callback([]);
          }
        }
      );
    }
  }

  onChainChanged(callback: (chainId: string) => void): void {
    if (this.wagmiConfig) {
      this.wagmiConfig.subscribe(
        (state: any) => state.chainId,
        (chainId: number) => {
          callback(`0x${chainId.toString(16)}`);
        }
      );
    }
  }

  getModal() {
    return this.web3Modal;
  }

  private getNetworkFromChainId(chainId?: number): 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' {
    switch (chainId) {
      case 1:
        return 'ethereum';
      case 137:
        return 'polygon';
      case 42161:
        return 'arbitrum';
      case 10:
        return 'optimism';
      default:
        return 'ethereum';
    }
  }

  // Additional helper methods
  async switchNetwork(chainId: number): Promise<void> {
    if (!this.wagmiConfig) {
      throw new Error('WalletConnect not initialized');
    }

    await this.wagmiConfig.switchChain({ chainId });
  }

  async getCurrentAccount(): Promise<string | null> {
    const account = this.wagmiConfig?.getAccount();
    return account?.address || null;
  }

  async getChainId(): Promise<number | null> {
    const account = this.wagmiConfig?.getAccount();
    return account?.chainId || null;
  }
}