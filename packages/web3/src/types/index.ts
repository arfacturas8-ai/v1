export interface CryptoWallet {
  address: string;
  network: 'ethereum' | 'bitcoin' | 'polygon' | 'arbitrum' | 'optimism';
  type: 'metamask' | 'walletconnect' | 'coinbase' | 'trust';
  balance?: string;
  tokens?: TokenBalance[];
  chainId?: number;
  isConnected: boolean;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  contractAddress?: string;
  balance: string;
  decimals: number;
  usdValue?: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice?: string;
  gasLimit?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp: number;
  network: string;
}

export interface NFTMetadata {
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  owner: string;
  network: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface SmartContract {
  address: string;
  abi: any[];
  network: string;
  name: string;
}

export interface WalletConnectConfig {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

export interface CryptoConfig {
  infura?: {
    apiKey: string;
    apiSecret?: string;
  };
  alchemy?: {
    apiKey: string;
  };
  blockCypher?: {
    token?: string;
  };
  moralis?: {
    apiKey: string;
  };
  coingecko?: {
    apiKey?: string;
  };
  transak?: {
    apiKey: string;
    environment: 'staging' | 'production';
  };
  walletConnect?: WalletConnectConfig;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  network: string;
  rpcUrl: string;
  blockExplorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface PaymentRequest {
  amount: string;
  currency: string;
  recipient: string;
  metadata?: Record<string, any>;
}

export interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'trust';

export interface WalletProvider {
  connect(): Promise<CryptoWallet>;
  disconnect(): Promise<void>;
  signMessage(message: string): Promise<string>;
  sendTransaction(transaction: Transaction): Promise<string>;
  getBalance(address: string): Promise<string>;
  isInstalled(): boolean;
  onAccountChanged(callback: (accounts: string[]) => void): void;
  onChainChanged(callback: (chainId: string) => void): void;
}