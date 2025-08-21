# CRYB Platform - Complete Crypto & Blockchain Implementation Guide

## 🏗️ Foundation Tech Stack Overview

Based on the locked CRYB tech stack, our crypto implementation builds on:

**🪙 Core Crypto & Blockchain Stack:**
- **Ethereum API**: Infura (wallet connections, smart contracts)
- **Bitcoin API**: Block Cypher (Bitcoin blockchain interactions)  
- **NFT Management**: Moralis (cross-chain NFT API)
- **Market Data**: Coingecko (prices, charts, market data)
- **Payment Processing**: Transak (fiat-to-crypto onramp)
- **Shared Utilities**: `packages/shared/crypto/` (crypto utilities)

---

## 📚 Table of Contents

1. [Crypto Fundamentals & Architecture](#1-crypto-fundamentals--architecture)
2. [Wallet Integration System](#2-wallet-integration-system)
3. [Ethereum & Smart Contract Integration](#3-ethereum--smart-contract-integration)
4. [Bitcoin Integration](#4-bitcoin-integration)
5. [NFT Management System](#5-nft-management-system)
6. [Market Data & Price Feeds](#6-market-data--price-feeds)
7. [Payment Processing](#7-payment-processing)
8. [Shared Crypto Utilities](#8-shared-crypto-utilities)
9. [Security Implementation](#9-security-implementation)
10. [Testing & Validation](#10-testing--validation)

---

## 1. Crypto Fundamentals & Architecture

### 1.1 Core Concepts Implementation

```typescript
// packages/shared/crypto/types.ts
export interface CryptoWallet {
  address: string;
  network: 'ethereum' | 'bitcoin' | 'polygon' | 'arbitrum';
  type: 'metamask' | 'walletconnect' | 'coinbase' | 'trust';
  balance?: string;
  tokens?: TokenBalance[];
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

export interface SmartContract {
  address: string;
  abi: any[];
  network: string;
  name: string;
  functions: ContractFunction[];
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
```

### 1.2 Crypto Service Architecture

```typescript
// packages/shared/crypto/CryptoManager.ts
export class CryptoManager {
  private infuraProvider: InfuraProvider;
  private blockCypherClient: BlockCypherClient;
  private moralisClient: MoralisClient;
  private coingeckoClient: CoingeckoClient;
  private transakClient: TransakClient;

  constructor(config: CryptoConfig) {
    this.infuraProvider = new InfuraProvider(config.infura);
    this.blockCypherClient = new BlockCypherClient(config.blockCypher);
    this.moralisClient = new MoralisClient(config.moralis);
    this.coingeckoClient = new CoingeckoClient();
    this.transakClient = new TransakClient(config.transak);
  }

  // Universal wallet connection
  async connectWallet(type: WalletType): Promise<CryptoWallet> {
    switch (type) {
      case 'metamask':
        return await this.connectMetaMask();
      case 'walletconnect':
        return await this.connectWalletConnect();
      case 'coinbase':
        return await this.connectCoinbase();
      default:
        throw new Error(`Unsupported wallet type: ${type}`);
    }
  }

  // Multi-chain balance checking
  async getWalletBalance(address: string, networks: string[]): Promise<WalletBalance> {
    const balances = await Promise.all(
      networks.map(network => this.getNetworkBalance(address, network))
    );

    return {
      totalUsd: balances.reduce((sum, balance) => sum + balance.usdValue, 0),
      byNetwork: balances
    };
  }

  // Transaction monitoring
  async monitorTransaction(txHash: string, network: string): Promise<Transaction> {
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
    });
  }
}
```

---

## 2. Wallet Integration System

### 2.1 MetaMask Integration

```typescript
// packages/shared/crypto/wallets/MetaMaskProvider.ts
export class MetaMaskProvider {
  private ethereum: any;

  constructor() {
    this.ethereum = (window as any).ethereum;
  }

  async connect(): Promise<CryptoWallet> {
    if (!this.isInstalled()) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Get network
      const chainId = await this.ethereum.request({
        method: 'eth_chainId'
      });

      // Get balance
      const balance = await this.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });

      return {
        address: accounts[0],
        network: this.getNetworkName(chainId),
        type: 'metamask',
        balance: this.hexToEth(balance)
      };
    } catch (error) {
      throw new Error(`MetaMask connection failed: ${error.message}`);
    }
  }

  async signMessage(message: string): Promise<string> {
    const accounts = await this.ethereum.request({
      method: 'eth_accounts'
    });

    return await this.ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]]
    });
  }

  async sendTransaction(transaction: TransactionRequest): Promise<string> {
    return await this.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transaction]
    });
  }

  isInstalled(): boolean {
    return Boolean(this.ethereum && this.ethereum.isMetaMask);
  }

  // Event listeners
  onAccountChanged(callback: (accounts: string[]) => void): void {
    this.ethereum.on('accountsChanged', callback);
  }

  onChainChanged(callback: (chainId: string) => void): void {
    this.ethereum.on('chainChanged', callback);
  }

  private getNetworkName(chainId: string): string {
    const networks = {
      '0x1': 'ethereum',
      '0x89': 'polygon',
      '0xa4b1': 'arbitrum',
      '0xa': 'optimism'
    };
    return networks[chainId] || 'unknown';
  }

  private hexToEth(hex: string): string {
    return (parseInt(hex, 16) / 1e18).toString();
  }
}
```

### 2.2 WalletConnect Integration

```typescript
// packages/shared/crypto/wallets/WalletConnectProvider.ts
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { arbitrum, mainnet, polygon } from 'viem/chains';

export class WalletConnectProvider {
  private projectId: string;
  private web3Modal: any;
  private wagmiConfig: any;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.initializeWalletConnect();
  }

  private initializeWalletConnect(): void {
    const metadata = {
      name: 'CRYB Platform',
      description: 'Next-generation community platform with Web3 integration',
      url: 'https://cryb.com',
      icons: ['https://cryb.com/icon.png']
    };

    const chains = [mainnet, polygon, arbitrum];
    
    this.wagmiConfig = defaultWagmiConfig({
      chains,
      projectId: this.projectId,
      metadata
    });

    this.web3Modal = createWeb3Modal({
      wagmiConfig: this.wagmiConfig,
      projectId: this.projectId,
      enableAnalytics: true,
      themeMode: 'light',
      themeVariables: {
        '--w3m-color-mix': '#6366f1',
        '--w3m-color-mix-strength': 40
      }
    });
  }

  async connect(): Promise<CryptoWallet> {
    try {
      await this.web3Modal.open();
      
      // Wait for connection
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          const account = this.wagmiConfig.getAccount();
          if (account.isConnected) {
            resolve({
              address: account.address,
              network: account.chain?.name.toLowerCase() || 'ethereum',
              type: 'walletconnect'
            });
          } else {
            setTimeout(checkConnection, 500);
          }
        };
        checkConnection();
      });
    } catch (error) {
      throw new Error(`WalletConnect connection failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    await this.wagmiConfig.disconnect();
  }

  getModal() {
    return this.web3Modal;
  }
}
```

---

## 3. Ethereum & Smart Contract Integration

### 3.1 Infura Provider Setup

```typescript
// packages/shared/crypto/providers/InfuraProvider.ts
import { ethers } from 'ethers';

export class InfuraProvider {
  private provider: ethers.providers.InfuraProvider;
  private signer?: ethers.Signer;

  constructor(apiKey: string, network: string = 'mainnet') {
    this.provider = new ethers.providers.InfuraProvider(network, apiKey);
  }

  async connect(privateKey?: string): Promise<void> {
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  async getTokenBalance(tokenContract: string, walletAddress: string): Promise<string> {
    const contract = new ethers.Contract(
      tokenContract,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );
    
    const balance = await contract.balanceOf(walletAddress);
    return balance.toString();
  }

  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer available');
    }

    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.utils.parseEther(value),
      data
    });

    return tx.hash;
  }

  async deployContract(abi: any[], bytecode: string, ...args: any[]): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer available');
    }

    const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
    const contract = await factory.deploy(...args);
    await contract.deployed();
    
    return contract.address;
  }

  async callContract(
    contractAddress: string,
    abi: any[],
    functionName: string,
    ...args: any[]
  ): Promise<any> {
    const contract = new ethers.Contract(contractAddress, abi, this.provider);
    return await contract[functionName](...args);
  }

  async estimateGas(to: string, data: string): Promise<string> {
    const gasEstimate = await this.provider.estimateGas({ to, data });
    return gasEstimate.toString();
  }

  async getGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }
}
```

### 3.2 Smart Contract Utilities

```typescript
// packages/shared/crypto/contracts/ContractManager.ts
export class ContractManager {
  private provider: InfuraProvider;
  private contracts: Map<string, ethers.Contract> = new Map();

  constructor(provider: InfuraProvider) {
    this.provider = provider;
  }

  // ERC-20 Token Contract
  async loadERC20Contract(contractAddress: string): Promise<ethers.Contract> {
    const abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function transfer(address, uint256) returns (bool)',
      'function allowance(address, address) view returns (uint256)',
      'function approve(address, uint256) returns (bool)',
      'function transferFrom(address, address, uint256) returns (bool)',
      'event Transfer(address indexed, address indexed, uint256)',
      'event Approval(address indexed, address indexed, uint256)'
    ];

    const contract = new ethers.Contract(contractAddress, abi, this.provider.provider);
    this.contracts.set(contractAddress, contract);
    return contract;
  }

  // ERC-721 NFT Contract
  async loadERC721Contract(contractAddress: string): Promise<ethers.Contract> {
    const abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function tokenURI(uint256) view returns (string)',
      'function balanceOf(address) view returns (uint256)',
      'function ownerOf(uint256) view returns (address)',
      'function approve(address, uint256)',
      'function getApproved(uint256) view returns (address)',
      'function setApprovalForAll(address, bool)',
      'function isApprovedForAll(address, address) view returns (bool)',
      'function transferFrom(address, address, uint256)',
      'function safeTransferFrom(address, address, uint256)',
      'event Transfer(address indexed, address indexed, uint256 indexed)',
      'event Approval(address indexed, address indexed, uint256 indexed)',
      'event ApprovalForAll(address indexed, address indexed, bool)'
    ];

    const contract = new ethers.Contract(contractAddress, abi, this.provider.provider);
    this.contracts.set(contractAddress, contract);
    return contract;
  }

  // Generic contract interaction
  async callFunction(
    contractAddress: string,
    functionName: string,
    ...args: any[]
  ): Promise<any> {
    const contract = this.contracts.get(contractAddress);
    if (!contract) {
      throw new Error(`Contract ${contractAddress} not loaded`);
    }

    return await contract[functionName](...args);
  }

  // Token approval for spending
  async approveToken(
    tokenContract: string,
    spenderAddress: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<string> {
    const contract = this.contracts.get(tokenContract)?.connect(signer);
    if (!contract) {
      throw new Error(`Token contract ${tokenContract} not loaded`);
    }

    const tx = await contract.approve(spenderAddress, ethers.utils.parseEther(amount));
    return tx.hash;
  }
}
```

---

## 4. Bitcoin Integration

### 4.1 Block Cypher Client

```typescript
// packages/shared/crypto/bitcoin/BlockCypherClient.ts
export class BlockCypherClient {
  private baseUrl: string = 'https://api.blockcypher.com/v1/btc/main';
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private async request(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}${this.token ? `?token=${this.token}` : ''}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Block Cypher API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get Bitcoin address information
  async getAddress(address: string): Promise<BitcoinAddressInfo> {
    const data = await this.request(`/addrs/${address}`);
    return {
      address: data.address,
      balance: data.balance,
      unconfirmedBalance: data.unconfirmed_balance,
      totalReceived: data.total_received,
      totalSent: data.total_sent,
      txCount: data.n_tx
    };
  }

  // Get transaction details
  async getTransaction(txHash: string): Promise<BitcoinTransaction> {
    const data = await this.request(`/txs/${txHash}`);
    return {
      hash: data.hash,
      blockHeight: data.block_height,
      blockHash: data.block_hash,
      received: new Date(data.received),
      confirmed: data.confirmed ? new Date(data.confirmed) : undefined,
      inputs: data.inputs.map(input => ({
        address: input.addresses[0],
        value: input.output_value
      })),
      outputs: data.outputs.map(output => ({
        address: output.addresses[0],
        value: output.value
      })),
      fees: data.fees,
      size: data.size
    };
  }

  // Create new transaction
  async createTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    privateKey: string
  ): Promise<string> {
    // Get unspent outputs
    const utxos = await this.request(`/addrs/${fromAddress}?unspentOnly=true`);
    
    // Build transaction
    const tx = {
      inputs: utxos.txrefs.slice(0, 2).map(utxo => ({
        addresses: [fromAddress]
      })),
      outputs: [{
        addresses: [toAddress],
        value: amount
      }]
    };

    // Create and sign transaction
    const newTx = await this.request('/txs/new', 'POST', tx);
    
    // Sign with private key (simplified - use proper Bitcoin signing library)
    const signedTx = this.signTransaction(newTx, privateKey);
    
    // Send transaction
    const result = await this.request('/txs/send', 'POST', signedTx);
    return result.tx.hash;
  }

  // Get current Bitcoin price
  async getCurrentPrice(): Promise<number> {
    // This would typically use a different API, but for completeness
    const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
    const data = await response.json();
    return parseFloat(data.bpi.USD.rate.replace(',', ''));
  }

  // Monitor address for new transactions
  async subscribeToAddress(address: string, webhook: string): Promise<string> {
    const subscription = await this.request('/hooks', 'POST', {
      event: 'confirmed-tx',
      address,
      url: webhook
    });
    return subscription.id;
  }

  private signTransaction(tx: any, privateKey: string): any {
    // Implement Bitcoin transaction signing
    // This is a simplified placeholder - use bitcoinjs-lib or similar
    return {
      ...tx,
      signatures: tx.tosign.map(() => 'signed_with_private_key')
    };
  }
}

interface BitcoinAddressInfo {
  address: string;
  balance: number;
  unconfirmedBalance: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
}

interface BitcoinTransaction {
  hash: string;
  blockHeight?: number;
  blockHash?: string;
  received: Date;
  confirmed?: Date;
  inputs: { address: string; value: number }[];
  outputs: { address: string; value: number }[];
  fees: number;
  size: number;
}
```

---

## 5. NFT Management System

### 5.1 Moralis NFT Client

```typescript
// packages/shared/crypto/nft/MoralisClient.ts
import Moralis from 'moralis';

export class MoralisClient {
  private initialized: boolean = false;

  constructor(apiKey: string) {
    this.initialize(apiKey);
  }

  private async initialize(apiKey: string): Promise<void> {
    if (!this.initialized) {
      await Moralis.start({ apiKey });
      this.initialized = true;
    }
  }

  // Get NFTs owned by an address
  async getNFTsByOwner(address: string, chain: string = 'eth'): Promise<NFTMetadata[]> {
    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain,
      format: 'decimal',
      limit: 100
    });

    return response.toJSON().result.map(nft => ({
      tokenId: nft.token_id,
      contractAddress: nft.token_address,
      name: nft.name || 'Unknown',
      description: nft.metadata?.description || '',
      image: this.resolveImageUrl(nft.metadata?.image),
      attributes: nft.metadata?.attributes || [],
      owner: address,
      network: chain
    }));
  }

  // Get NFT metadata
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chain: string = 'eth'
  ): Promise<NFTMetadata> {
    const response = await Moralis.EvmApi.nft.getNFTMetadata({
      address: contractAddress,
      tokenId,
      chain,
      format: 'decimal'
    });

    const nft = response.toJSON();
    
    return {
      tokenId: nft.token_id,
      contractAddress: nft.token_address,
      name: nft.name || 'Unknown',
      description: nft.metadata?.description || '',
      image: this.resolveImageUrl(nft.metadata?.image),
      attributes: nft.metadata?.attributes || [],
      owner: nft.owner_of,
      network: chain
    };
  }

  // Get NFT transfers
  async getNFTTransfers(
    contractAddress: string,
    tokenId?: string,
    chain: string = 'eth'
  ): Promise<NFTTransfer[]> {
    const params: any = {
      address: contractAddress,
      chain,
      format: 'decimal'
    };

    if (tokenId) {
      params.tokenId = tokenId;
    }

    const response = await Moralis.EvmApi.nft.getNFTTransfers(params);
    
    return response.toJSON().result.map(transfer => ({
      transactionHash: transfer.transaction_hash,
      from: transfer.from_address,
      to: transfer.to_address,
      tokenId: transfer.token_id,
      contractAddress: transfer.token_address,
      blockNumber: transfer.block_number,
      timestamp: new Date(transfer.block_timestamp)
    }));
  }

  // Search NFTs by name
  async searchNFTs(query: string, chain: string = 'eth'): Promise<NFTCollection[]> {
    const response = await Moralis.EvmApi.utils.searchNFTs({
      query,
      chain,
      format: 'decimal'
    });

    return response.toJSON().result.map(collection => ({
      contractAddress: collection.token_address,
      name: collection.name,
      symbol: collection.symbol,
      contractType: collection.contract_type
    }));
  }

  // Get NFT collection stats
  async getCollectionStats(contractAddress: string, chain: string = 'eth'): Promise<NFTCollectionStats> {
    // Note: This might require different Moralis endpoints or additional API calls
    const response = await Moralis.EvmApi.nft.getNFTContractMetadata({
      address: contractAddress,
      chain
    });

    const metadata = response.toJSON();

    return {
      contractAddress,
      name: metadata.name,
      symbol: metadata.symbol,
      totalSupply: metadata.total_supply || 0,
      contractType: metadata.contract_type,
      syncedAt: new Date(metadata.synced_at)
    };
  }

  private resolveImageUrl(imageUrl?: string): string {
    if (!imageUrl) return '';
    
    // Handle IPFS URLs
    if (imageUrl.startsWith('ipfs://')) {
      return imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    return imageUrl;
  }
}

interface NFTTransfer {
  transactionHash: string;
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
  blockNumber: number;
  timestamp: Date;
}

interface NFTCollection {
  contractAddress: string;
  name: string;
  symbol: string;
  contractType: string;
}

interface NFTCollectionStats {
  contractAddress: string;
  name: string;
  symbol: string;
  totalSupply: number;
  contractType: string;
  syncedAt: Date;
}
```

---

## 6. Market Data & Price Feeds

### 6.1 CoinGecko Integration

```typescript
// packages/shared/crypto/market/CoingeckoClient.ts
export class CoingeckoClient {
  private baseUrl: string = 'https://api.coingecko.com/api/v3';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};
    
    if (this.apiKey) {
      headers['X-CG-API-KEY'] = this.apiKey;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get current price of cryptocurrencies
  async getCurrentPrices(
    coins: string[],
    currencies: string[] = ['usd']
  ): Promise<Record<string, Record<string, number>>> {
    const coinsParam = coins.join(',');
    const currenciesParam = currencies.join(',');
    
    return await this.request(
      `/simple/price?ids=${coinsParam}&vs_currencies=${currenciesParam}&include_24hr_change=true`
    );
  }

  // Get detailed coin information
  async getCoinDetails(coinId: string): Promise<CoinDetails> {
    const data = await this.request(`/coins/${coinId}`);
    
    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      description: data.description.en,
      image: data.image.large,
      marketCap: data.market_data.market_cap.usd,
      currentPrice: data.market_data.current_price.usd,
      priceChange24h: data.market_data.price_change_percentage_24h,
      volume24h: data.market_data.total_volume.usd,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply,
      maxSupply: data.market_data.max_supply
    };
  }

  // Get historical price data
  async getHistoricalPrices(
    coinId: string,
    days: number = 30,
    currency: string = 'usd'
  ): Promise<PricePoint[]> {
    const data = await this.request(
      `/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
    );

    return data.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp: new Date(timestamp),
      price
    }));
  }

  // Get trending coins
  async getTrendingCoins(): Promise<TrendingCoin[]> {
    const data = await this.request('/search/trending');
    
    return data.coins.map((coin: any) => ({
      id: coin.item.id,
      name: coin.item.name,
      symbol: coin.item.symbol,
      marketCapRank: coin.item.market_cap_rank,
      thumb: coin.item.thumb
    }));
  }

  // Get market overview
  async getGlobalMarketData(): Promise<GlobalMarketData> {
    const data = await this.request('/global');
    
    return {
      totalMarketCap: data.data.total_market_cap.usd,
      totalVolume: data.data.total_volume.usd,
      marketCapPercentage: data.data.market_cap_percentage,
      activeCryptocurrencies: data.data.active_cryptocurrencies,
      markets: data.data.markets,
      marketCapChangePercentage24h: data.data.market_cap_change_percentage_24h_usd
    };
  }

  // Search for coins
  async searchCoins(query: string): Promise<CoinSearchResult[]> {
    const data = await this.request(`/search?query=${encodeURIComponent(query)}`);
    
    return data.coins.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      marketCapRank: coin.market_cap_rank,
      thumb: coin.thumb
    }));
  }

  // Get supported currencies
  async getSupportedCurrencies(): Promise<string[]> {
    return await this.request('/simple/supported_vs_currencies');
  }
}

interface CoinDetails {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  marketCap: number;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
}

interface PricePoint {
  timestamp: Date;
  price: number;
}

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  thumb: string;
}

interface GlobalMarketData {
  totalMarketCap: number;
  totalVolume: number;
  marketCapPercentage: Record<string, number>;
  activeCryptocurrencies: number;
  markets: number;
  marketCapChangePercentage24h: number;
}

interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  thumb: string;
}
```

---

## 7. Payment Processing

### 7.1 Transak Integration

```typescript
// packages/shared/crypto/payments/TransakClient.ts
export class TransakClient {
  private apiKey: string;
  private environment: 'staging' | 'production';
  private baseUrl: string;

  constructor(apiKey: string, environment: 'staging' | 'production' = 'staging') {
    this.apiKey = apiKey;
    this.environment = environment;
    this.baseUrl = environment === 'production' 
      ? 'https://api.transak.com' 
      : 'https://staging-api.transak.com';
  }

  // Initialize Transak widget
  createWidget(config: TransakWidgetConfig): TransakWidget {
    return new TransakWidget({
      apiKey: this.apiKey,
      environment: this.environment,
      ...config
    });
  }

  // Get supported cryptocurrencies
  async getSupportedCryptocurrencies(): Promise<SupportedCrypto[]> {
    const response = await this.request('/api/v2/currencies/crypto-currencies');
    return response.response.map(crypto => ({
      symbol: crypto.symbol,
      name: crypto.name,
      network: crypto.network,
      isAllowed: crypto.isAllowed
    }));
  }

  // Get supported fiat currencies
  async getSupportedFiatCurrencies(): Promise<SupportedFiat[]> {
    const response = await this.request('/api/v2/currencies/fiat-currencies');
    return response.response.map(fiat => ({
      symbol: fiat.symbol,
      name: fiat.name,
      isAllowed: fiat.isAllowed
    }));
  }

  // Get supported countries
  async getSupportedCountries(): Promise<SupportedCountry[]> {
    const response = await this.request('/api/v2/countries');
    return response.response.map(country => ({
      alpha2: country.alpha2,
      alpha3: country.alpha3,
      name: country.name,
      isAllowed: country.isAllowed
    }));
  }

  // Get exchange rates
  async getExchangeRates(
    fiatCurrency: string,
    cryptoCurrency: string,
    isBuyOrSell: 'BUY' | 'SELL',
    network?: string
  ): Promise<ExchangeRate> {
    const params = new URLSearchParams({
      fiatCurrency,
      cryptoCurrency,
      isBuyOrSell,
      ...(network && { network })
    });

    const response = await this.request(`/api/v2/currencies/price?${params}`);
    return {
      fiatCurrency: response.response.fiatCurrency,
      cryptoCurrency: response.response.cryptoCurrency,
      conversionPrice: response.response.conversionPrice,
      slippage: response.response.slippage,
      fees: response.response.fees
    };
  }

  // Create order
  async createOrder(orderData: CreateOrderRequest): Promise<TransakOrder> {
    const response = await this.request('/api/v2/orders', 'POST', orderData);
    return {
      id: response.response.id,
      status: response.response.status,
      fiatCurrency: response.response.fiatCurrency,
      cryptoCurrency: response.response.cryptoCurrency,
      fiatAmount: response.response.fiatAmount,
      cryptoAmount: response.response.cryptoAmount,
      walletAddress: response.response.walletAddress,
      redirectUrl: response.response.redirectURL
    };
  }

  // Get order status
  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const response = await this.request(`/api/v2/orders/${orderId}`);
    return {
      id: response.response.id,
      status: response.response.status,
      statusReason: response.response.statusReason,
      transactionHash: response.response.transactionHash,
      transactionLink: response.response.transactionLink
    };
  }

  private async request(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Transak API error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Transak Widget Implementation
export class TransakWidget {
  private config: TransakWidgetConfig;
  private widget?: any;

  constructor(config: TransakWidgetConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    // Load Transak SDK
    if (!(window as any).transakSDK) {
      await this.loadTransakSDK();
    }

    this.widget = new (window as any).TransakSDK.default({
      apiKey: this.config.apiKey,
      environment: this.config.environment,
      defaultCryptoCurrency: this.config.defaultCryptoCurrency || 'ETH',
      defaultFiatCurrency: this.config.defaultFiatCurrency || 'USD',
      defaultPaymentMethod: this.config.defaultPaymentMethod || 'credit_debit_card',
      walletAddress: this.config.walletAddress,
      themeColor: this.config.themeColor || '#6366f1',
      hostURL: window.location.origin,
      widgetHeight: this.config.widgetHeight || '625px',
      widgetWidth: this.config.widgetWidth || '450px'
    });

    this.widget.init();

    // Set up event listeners
    this.setupEventListeners();
  }

  private async loadTransakSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://global.transak.com/sdk/v1.2/transak.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Transak SDK'));
      document.head.appendChild(script);
    });
  }

  private setupEventListeners(): void {
    this.widget.on('TRANSAK_WIDGET_INITIALISED', () => {
      console.log('Transak widget initialized');
    });

    this.widget.on('TRANSAK_ORDER_SUCCESSFUL', (orderData: any) => {
      console.log('Order successful:', orderData);
      this.config.onSuccess?.(orderData);
    });

    this.widget.on('TRANSAK_ORDER_FAILED', (error: any) => {
      console.error('Order failed:', error);
      this.config.onError?.(error);
    });

    this.widget.on('TRANSAK_WIDGET_CLOSE', () => {
      console.log('Widget closed');
      this.config.onClose?.();
    });
  }

  close(): void {
    this.widget?.close();
  }
}

// Interfaces
interface TransakWidgetConfig {
  apiKey: string;
  environment: 'staging' | 'production';
  walletAddress?: string;
  defaultCryptoCurrency?: string;
  defaultFiatCurrency?: string;
  defaultPaymentMethod?: string;
  themeColor?: string;
  widgetHeight?: string;
  widgetWidth?: string;
  onSuccess?: (orderData: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

interface SupportedCrypto {
  symbol: string;
  name: string;
  network: string;
  isAllowed: boolean;
}

interface SupportedFiat {
  symbol: string;
  name: string;
  isAllowed: boolean;
}

interface SupportedCountry {
  alpha2: string;
  alpha3: string;
  name: string;
  isAllowed: boolean;
}

interface ExchangeRate {
  fiatCurrency: string;
  cryptoCurrency: string;
  conversionPrice: number;
  slippage: number;
  fees: any;
}

interface CreateOrderRequest {
  fiatCurrency: string;
  cryptoCurrency: string;
  isBuyOrSell: 'BUY' | 'SELL';
  fiatAmount?: number;
  cryptoAmount?: number;
  walletAddress: string;
  email?: string;
  userData?: any;
}

interface TransakOrder {
  id: string;
  status: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  fiatAmount: number;
  cryptoAmount: number;
  walletAddress: string;
  redirectUrl: string;
}

interface OrderStatus {
  id: string;
  status: string;
  statusReason?: string;
  transactionHash?: string;
  transactionLink?: string;
}
```

---

## 8. Shared Crypto Utilities

### 8.1 Core Utilities

```typescript
// packages/shared/crypto/utils/CryptoUtils.ts
import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';

export class CryptoUtils {
  // Ethereum utilities
  static isValidEthereumAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }

  static formatEthereumAddress(address: string): string {
    return ethers.utils.getAddress(address); // Checksummed format
  }

  static parseEther(amount: string): string {
    return ethers.utils.parseEther(amount).toString();
  }

  static formatEther(amount: string): string {
    return ethers.utils.formatEther(amount);
  }

  static formatTokenAmount(amount: string, decimals: number): string {
    return ethers.utils.formatUnits(amount, decimals);
  }

  static parseTokenAmount(amount: string, decimals: number): string {
    return ethers.utils.parseUnits(amount, decimals).toString();
  }

  // Bitcoin utilities
  static isValidBitcoinAddress(address: string, network: 'mainnet' | 'testnet' = 'mainnet'): boolean {
    try {
      const net = network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
      bitcoin.address.toOutputScript(address, net);
      return true;
    } catch {
      return false;
    }
  }

  static satoshisToBTC(satoshis: number): number {
    return satoshis / 100000000;
  }

  static btcToSatoshis(btc: number): number {
    return Math.round(btc * 100000000);
  }

  // General utilities
  static shortenAddress(address: string, start: number = 6, end: number = 4): string {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  }

  static generateRandomWallet(): { address: string; privateKey: string } {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  }

  static validatePrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  // Price formatting
  static formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  }

  static formatCryptoAmount(amount: number, symbol: string, decimals: number = 6): string {
    return `${amount.toFixed(decimals)} ${symbol}`;
  }

  // Hash functions
  static keccak256(data: string): string {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
  }

  static sha256(data: string): string {
    return ethers.utils.sha256(ethers.utils.toUtf8Bytes(data));
  }

  // Signature utilities
  static async signMessage(message: string, privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signMessage(message);
  }

  static verifySignature(message: string, signature: string, address: string): boolean {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }

  // Network utilities
  static getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      137: 'Polygon Mainnet',
      80001: 'Mumbai Testnet',
      42161: 'Arbitrum One',
      421613: 'Arbitrum Goerli',
      10: 'Optimism',
      420: 'Optimism Goerli'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  }

  static isTestnet(chainId: number): boolean {
    const testnets = [5, 80001, 421613, 420];
    return testnets.includes(chainId);
  }

  // Gas utilities
  static calculateGasCost(gasUsed: string, gasPrice: string): string {
    const gasCost = ethers.BigNumber.from(gasUsed).mul(gasPrice);
    return ethers.utils.formatEther(gasCost);
  }

  static gweiToWei(gwei: string): string {
    return ethers.utils.parseUnits(gwei, 'gwei').toString();
  }

  static weiToGwei(wei: string): string {
    return ethers.utils.formatUnits(wei, 'gwei');
  }
}
```

### 8.2 Storage Utilities

```typescript
// packages/shared/crypto/storage/CryptoStorage.ts
export class CryptoStorage {
  private static prefix = 'cryb_crypto_';

  // Wallet storage
  static saveWallet(wallet: CryptoWallet): void {
    const key = `${this.prefix}wallet_${wallet.address}`;
    localStorage.setItem(key, JSON.stringify(wallet));
  }

  static getWallet(address: string): CryptoWallet | null {
    const key = `${this.prefix}wallet_${address}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static getAllWallets(): CryptoWallet[] {
    const wallets: CryptoWallet[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.prefix}wallet_`)) {
        const data = localStorage.getItem(key);
        if (data) {
          wallets.push(JSON.parse(data));
        }
      }
    }
    return wallets;
  }

  static removeWallet(address: string): void {
    const key = `${this.prefix}wallet_${address}`;
    localStorage.removeItem(key);
  }

  // Transaction history
  static saveTransaction(transaction: Transaction): void {
    const key = `${this.prefix}tx_${transaction.hash}`;
    localStorage.setItem(key, JSON.stringify(transaction));
  }

  static getTransaction(hash: string): Transaction | null {
    const key = `${this.prefix}tx_${hash}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static getTransactionsByAddress(address: string): Transaction[] {
    const transactions: Transaction[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.prefix}tx_`)) {
        const data = localStorage.getItem(key);
        if (data) {
          const tx = JSON.parse(data);
          if (tx.from === address || tx.to === address) {
            transactions.push(tx);
          }
        }
      }
    }
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Price cache
  static savePriceData(symbol: string, priceData: any): void {
    const key = `${this.prefix}price_${symbol}`;
    const data = {
      ...priceData,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  static getPriceData(symbol: string, maxAge: number = 300000): any | null {
    const key = `${this.prefix}price_${symbol}`;
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Date.now() - parsed.timestamp < maxAge) {
        return parsed;
      }
    }
    return null;
  }

  // Settings
  static saveSettings(settings: CryptoSettings): void {
    const key = `${this.prefix}settings`;
    localStorage.setItem(key, JSON.stringify(settings));
  }

  static getSettings(): CryptoSettings {
    const key = `${this.prefix}settings`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return {
      defaultNetwork: 'ethereum',
      preferredCurrency: 'USD',
      gasSettings: 'medium',
      notifications: true
    };
  }

  // Clear all crypto data
  static clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  }
}

interface CryptoSettings {
  defaultNetwork: string;
  preferredCurrency: string;
  gasSettings: 'slow' | 'medium' | 'fast';
  notifications: boolean;
}
```

---

## 9. Security Implementation

### 9.1 Security Best Practices

```typescript
// packages/shared/crypto/security/SecurityManager.ts
export class SecurityManager {
  // Validate wallet connection
  static async validateWalletConnection(wallet: CryptoWallet): Promise<boolean> {
    try {
      // Check if address is valid
      if (!CryptoUtils.isValidEthereumAddress(wallet.address)) {
        return false;
      }

      // Verify wallet is still connected
      if (wallet.type === 'metamask') {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts'
        });
        return accounts.includes(wallet.address);
      }

      return true;
    } catch {
      return false;
    }
  }

  // Sanitize transaction data
  static sanitizeTransactionData(data: any): any {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    delete sanitized.privateKey;
    delete sanitized.mnemonic;
    delete sanitized.seed;
    
    // Validate addresses
    if (sanitized.to && !CryptoUtils.isValidEthereumAddress(sanitized.to)) {
      throw new Error('Invalid recipient address');
    }
    
    if (sanitized.from && !CryptoUtils.isValidEthereumAddress(sanitized.from)) {
      throw new Error('Invalid sender address');
    }
    
    // Validate amounts
    if (sanitized.value) {
      const value = parseFloat(sanitized.value);
      if (isNaN(value) || value < 0) {
        throw new Error('Invalid transaction amount');
      }
    }
    
    return sanitized;
  }

  // Rate limiting for API calls
  private static rateLimits: Map<string, number[]> = new Map();
  
  static checkRateLimit(key: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.rateLimits.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.rateLimits.set(key, validRequests);
    return true;
  }

  // Validate smart contract interaction
  static validateContractCall(
    contractAddress: string,
    functionName: string,
    args: any[]
  ): boolean {
    // Check contract address
    if (!CryptoUtils.isValidEthereumAddress(contractAddress)) {
      return false;
    }
    
    // Validate function name (no special characters)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(functionName)) {
      return false;
    }
    
    // Basic argument validation
    if (!Array.isArray(args)) {
      return false;
    }
    
    return true;
  }

  // Encrypt sensitive data
  static encryptSensitiveData(data: string, password: string): string {
    // Use Web Crypto API for encryption
    // This is a simplified implementation
    const encrypted = btoa(data + password); // Base64 encoding (use proper encryption in production)
    return encrypted;
  }

  static decryptSensitiveData(encryptedData: string, password: string): string {
    // Corresponding decryption
    const decrypted = atob(encryptedData);
    return decrypted.replace(password, '');
  }

  // Validate transaction before signing
  static async validateTransaction(tx: any): Promise<{valid: boolean; errors: string[]}> {
    const errors: string[] = [];
    
    // Check required fields
    if (!tx.to) {
      errors.push('Missing recipient address');
    } else if (!CryptoUtils.isValidEthereumAddress(tx.to)) {
      errors.push('Invalid recipient address');
    }
    
    if (!tx.value || parseFloat(tx.value) <= 0) {
      errors.push('Invalid transaction amount');
    }
    
    // Check gas settings
    if (tx.gasLimit && parseInt(tx.gasLimit) < 21000) {
      errors.push('Gas limit too low');
    }
    
    if (tx.gasPrice && parseInt(tx.gasPrice) <= 0) {
      errors.push('Invalid gas price');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Monitor for suspicious activity
  static flagSuspiciousActivity(activity: ActivityLog): boolean {
    const flags = [
      // Large transactions
      activity.type === 'transaction' && parseFloat(activity.amount || '0') > 10000,
      
      // Rapid transactions
      activity.type === 'transaction' && this.isRapidTransaction(activity.address),
      
      // Unknown contracts
      activity.type === 'contract_interaction' && !this.isKnownContract(activity.contractAddress),
      
      // Multiple failed transactions
      activity.type === 'failed_transaction' && this.hasMultipleFailures(activity.address)
    ];
    
    return flags.some(flag => flag);
  }
  
  private static isRapidTransaction(address: string): boolean {
    // Check if user has made multiple transactions in short time
    const recentTxs = CryptoStorage.getTransactionsByAddress(address)
      .filter(tx => Date.now() - tx.timestamp < 300000); // 5 minutes
    return recentTxs.length > 5;
  }
  
  private static isKnownContract(address: string): boolean {
    const knownContracts = [
      '0xA0b86991c631F4ED1DC5fCC7E1C2745e8fB9Aea3', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
    ];
    return knownContracts.includes(address);
  }
  
  private static hasMultipleFailures(address: string): boolean {
    const failedTxs = CryptoStorage.getTransactionsByAddress(address)
      .filter(tx => tx.status === 'failed' && Date.now() - tx.timestamp < 3600000); // 1 hour
    return failedTxs.length > 3;
  }
}

interface ActivityLog {
  type: 'transaction' | 'contract_interaction' | 'failed_transaction';
  address: string;
  amount?: string;
  contractAddress?: string;
  timestamp: number;
}
```

---

## 10. Testing & Validation

### 10.1 Test Suite

```typescript
// packages/shared/crypto/__tests__/CryptoManager.test.ts
import { CryptoManager } from '../CryptoManager';
import { CryptoUtils } from '../utils/CryptoUtils';
import { SecurityManager } from '../security/SecurityManager';

describe('CryptoManager', () => {
  let cryptoManager: CryptoManager;

  beforeEach(() => {
    cryptoManager = new CryptoManager({
      infura: { apiKey: 'test-key' },
      blockCypher: { token: 'test-token' },
      moralis: { apiKey: 'test-key' },
      transak: { apiKey: 'test-key', environment: 'staging' }
    });
  });

  describe('Wallet Connection', () => {
    test('should validate Ethereum addresses', () => {
      const validAddress = '0x742d35Cc8e27c684c2A6D2a1C3Fc6bEdc75f78bb';
      const invalidAddress = '0xinvalid';

      expect(CryptoUtils.isValidEthereumAddress(validAddress)).toBe(true);
      expect(CryptoUtils.isValidEthereumAddress(invalidAddress)).toBe(false);
    });

    test('should format addresses correctly', () => {
      const address = '0x742d35cc8e27c684c2a6d2a1c3fc6bedc75f78bb';
      const formatted = CryptoUtils.formatEthereumAddress(address);
      
      expect(formatted).toBe('0x742d35Cc8e27c684c2A6D2a1C3Fc6bEdc75f78bb');
    });

    test('should shorten addresses for display', () => {
      const address = '0x742d35Cc8e27c684c2A6D2a1C3Fc6bEdc75f78bb';
      const shortened = CryptoUtils.shortenAddress(address);
      
      expect(shortened).toBe('0x742d...78bb');
    });
  });

  describe('Amount Formatting', () => {
    test('should convert Wei to Ether correctly', () => {
      const wei = '1000000000000000000';
      const ether = CryptoUtils.formatEther(wei);
      
      expect(ether).toBe('1.0');
    });

    test('should convert Ether to Wei correctly', () => {
      const ether = '1.5';
      const wei = CryptoUtils.parseEther(ether);
      
      expect(wei).toBe('1500000000000000000');
    });

    test('should format token amounts with decimals', () => {
      const amount = '1000000'; // 1 USDC (6 decimals)
      const formatted = CryptoUtils.formatTokenAmount(amount, 6);
      
      expect(formatted).toBe('1.0');
    });
  });

  describe('Security Validation', () => {
    test('should validate transaction data', async () => {
      const validTx = {
        to: '0x742d35Cc8e27c684c2A6D2a1C3Fc6bEdc75f78bb',
        value: '1.0',
        gasLimit: '21000',
        gasPrice: '20000000000'
      };

      const result = await SecurityManager.validateTransaction(validTx);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid transaction data', async () => {
      const invalidTx = {
        to: '0xinvalid',
        value: '-1.0',
        gasLimit: '100'
      };

      const result = await SecurityManager.validateTransaction(invalidTx);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should enforce rate limiting', () => {
      const key = 'test-user';
      
      // Should allow first request
      expect(SecurityManager.checkRateLimit(key, 2, 1000)).toBe(true);
      
      // Should allow second request
      expect(SecurityManager.checkRateLimit(key, 2, 1000)).toBe(true);
      
      // Should reject third request
      expect(SecurityManager.checkRateLimit(key, 2, 1000)).toBe(false);
    });
  });

  describe('Price Formatting', () => {
    test('should format USD prices correctly', () => {
      const price = 1234.56789;
      const formatted = CryptoUtils.formatPrice(price, 'USD');
      
      expect(formatted).toBe('$1,234.57');
    });

    test('should format crypto amounts correctly', () => {
      const amount = 1.23456789;
      const formatted = CryptoUtils.formatCryptoAmount(amount, 'ETH', 4);
      
      expect(formatted).toBe('1.2346 ETH');
    });
  });

  describe('Network Utilities', () => {
    test('should identify networks correctly', () => {
      expect(CryptoUtils.getNetworkName(1)).toBe('Ethereum Mainnet');
      expect(CryptoUtils.getNetworkName(137)).toBe('Polygon Mainnet');
      expect(CryptoUtils.getNetworkName(42161)).toBe('Arbitrum One');
    });

    test('should identify testnets correctly', () => {
      expect(CryptoUtils.isTestnet(5)).toBe(true); // Goerli
      expect(CryptoUtils.isTestnet(1)).toBe(false); // Mainnet
    });
  });

  describe('Signature Verification', () => {
    test('should verify message signatures correctly', () => {
      const message = 'Hello CRYB!';
      const signature = '0x...'; // This would be a real signature in practice
      const address = '0x742d35Cc8e27c684c2A6D2a1C3Fc6bEdc75f78bb';
      
      // This test would require a real signature
      // const isValid = CryptoUtils.verifySignature(message, signature, address);
      // expect(isValid).toBe(true);
    });
  });
});
```

### 10.2 Integration Tests

```typescript
// packages/shared/crypto/__tests__/integration.test.ts
describe('Crypto Integration Tests', () => {
  test('should connect to Infura provider', async () => {
    const infuraProvider = new InfuraProvider(process.env.INFURA_API_KEY!);
    
    // Test connection by getting latest block
    const blockNumber = await infuraProvider.provider.getBlockNumber();
    expect(blockNumber).toBeGreaterThan(0);
  });

  test('should fetch current prices from CoinGecko', async () => {
    const coingecko = new CoingeckoClient();
    
    const prices = await coingecko.getCurrentPrices(['ethereum', 'bitcoin']);
    expect(prices.ethereum.usd).toBeGreaterThan(0);
    expect(prices.bitcoin.usd).toBeGreaterThan(0);
  });

  test('should handle Moralis NFT queries', async () => {
    const moralis = new MoralisClient(process.env.MORALIS_API_KEY!);
    
    // Test with a known address that has NFTs
    const nfts = await moralis.getNFTsByOwner('0x...', 'eth');
    expect(Array.isArray(nfts)).toBe(true);
  });

  test('should validate Transak integration', async () => {
    const transak = new TransakClient(process.env.TRANSAK_API_KEY!, 'staging');
    
    const currencies = await transak.getSupportedCryptocurrencies();
    expect(Array.isArray(currencies)).toBe(true);
    expect(currencies.length).toBeGreaterThan(0);
  });
});
```

---

## 🚀 Implementation Checklist

### ✅ **Development Phases**

**Phase 1: Foundation (Week 1-2)**
- [ ] Set up crypto utilities package structure
- [ ] Implement basic wallet connection (MetaMask)
- [ ] Add Ethereum/Infura integration
- [ ] Create security validation layer

**Phase 2: Multi-chain Support (Week 3-4)**
- [ ] Add WalletConnect integration
- [ ] Implement Bitcoin support via Block Cypher
- [ ] Add polygon/Arbitrum network support
- [ ] Create unified wallet interface

**Phase 3: Advanced Features (Week 5-6)**
- [ ] Integrate Moralis for NFT management
- [ ] Add CoinGecko price feeds
- [ ] Implement Transak payment processing
- [ ] Create comprehensive testing suite

**Phase 4: Security & Polish (Week 7)**
- [ ] Security audit and penetration testing
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] Production deployment preparation

### 💰 **Cost Breakdown**

**Free Tier Services:**
- Infura: 100K requests/month (FREE)
- Block Cypher: 5K calls/month (FREE)
- Moralis: Free tier available
- CoinGecko: Free tier (with rate limits)
- Transak: No setup fees

**Estimated Monthly Costs:**
- Infura Pro (if needed): $50/month
- Moralis Pro (if needed): $25/month
- Enhanced API limits: $25/month
- **Total: $0-100/month depending on usage**

### 🔧 **Configuration**

```typescript
// Environment variables needed
INFURA_API_KEY=your_infura_key
INFURA_SECRET=your_infura_secret
BLOCKCYPHER_TOKEN=your_blockcypher_token
MORALIS_API_KEY=your_moralis_key
COINGECKO_API_KEY=your_coingecko_key (optional)
TRANSAK_API_KEY=your_transak_key
TRANSAK_ENVIRONMENT=staging|production
```

---

## 🎯 **Success Metrics**

**Technical KPIs:**
- Wallet connection success rate: >95%
- Transaction processing time: <30 seconds
- API response time: <2 seconds
- Error rate: <1%

**User Experience KPIs:**
- Onboarding completion rate: >80%
- Payment success rate: >95%
- User retention (crypto features): >60%

**Security KPIs:**
- Zero security incidents
- 100% transaction validation
- Rate limiting effectiveness: >99%

---

This comprehensive crypto implementation provides CRYB with enterprise-grade blockchain integration, supporting multiple networks, payment processing, and advanced features while maintaining security and performance standards. The modular architecture allows for easy expansion and maintenance as the platform grows.