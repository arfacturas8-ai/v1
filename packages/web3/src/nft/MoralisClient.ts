import Moralis from 'moralis';
import { NFTMetadata } from '../types';

export interface NFTTransfer {
  transactionHash: string;
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
  blockNumber: number;
  timestamp: Date;
}

export interface NFTCollection {
  contractAddress: string;
  name: string;
  symbol: string;
  contractType: string;
  totalSupply?: number;
}

export interface NFTCollectionStats {
  contractAddress: string;
  name: string;
  symbol: string;
  totalSupply: number;
  contractType: string;
  syncedAt: Date;
}

export class MoralisClient {
  private initialized: boolean = false;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!this.initialized) {
      try {
        await Moralis.start({ apiKey: this.apiKey });
        this.initialized = true;
      } catch (error: any) {
        console.error('Failed to initialize Moralis:', error);
        throw new Error(`Moralis initialization failed: ${error.message}`);
      }
    }
  }

  // Ensure Moralis is initialized before making requests
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Get NFTs owned by an address
  async getNFTsByOwner(address: string, chain: string = 'eth'): Promise<NFTMetadata[]> {
    await this.ensureInitialized();
    
    try {
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        address,
        chain,
        format: 'decimal',
        normalizeMetadata: true,
        limit: 100
      });

      const nfts = response.toJSON();
      
      return (nfts.result || []).map((nft: any) => ({
        tokenId: nft.token_id || '',
        contractAddress: nft.token_address || '',
        name: nft.name || nft.normalized_metadata?.name || 'Unknown NFT',
        description: nft.normalized_metadata?.description || nft.metadata?.description || '',
        image: this.resolveImageUrl(nft.normalized_metadata?.image || nft.metadata?.image),
        attributes: this.parseAttributes(nft.normalized_metadata?.attributes || nft.metadata?.attributes),
        owner: address,
        network: chain
      }));
    } catch (error: any) {
      console.error('Error fetching NFTs:', error);
      throw new Error(`Failed to fetch NFTs: ${error.message}`);
    }
  }

  // Get NFT metadata
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chain: string = 'eth'
  ): Promise<NFTMetadata> {
    await this.ensureInitialized();
    
    try {
      const response = await Moralis.EvmApi.nft.getNFTMetadata({
        address: contractAddress,
        tokenId,
        chain,
        format: 'decimal',
        normalizeMetadata: true
      });

      const nft = response.toJSON();
      
      return {
        tokenId: nft.token_id || tokenId,
        contractAddress: nft.token_address || contractAddress,
        name: nft.name || nft.normalized_metadata?.name || 'Unknown NFT',
        description: nft.normalized_metadata?.description || nft.metadata?.description || '',
        image: this.resolveImageUrl(nft.normalized_metadata?.image || nft.metadata?.image),
        attributes: this.parseAttributes(nft.normalized_metadata?.attributes || nft.metadata?.attributes),
        owner: nft.owner_of || '',
        network: chain
      };
    } catch (error: any) {
      console.error('Error fetching NFT metadata:', error);
      throw new Error(`Failed to fetch NFT metadata: ${error.message}`);
    }
  }

  // Get NFT transfers
  async getNFTTransfers(
    contractAddress: string,
    tokenId?: string,
    chain: string = 'eth'
  ): Promise<NFTTransfer[]> {
    await this.ensureInitialized();
    
    try {
      const params: any = {
        address: contractAddress,
        chain,
        format: 'decimal'
      };

      if (tokenId) {
        params.tokenId = tokenId;
      }

      const response = await Moralis.EvmApi.nft.getNFTTransfers(params);
      const transfers = response.toJSON();
      
      return (transfers.result || []).map((transfer: any) => ({
        transactionHash: transfer.transaction_hash,
        from: transfer.from_address,
        to: transfer.to_address,
        tokenId: transfer.token_id,
        contractAddress: transfer.token_address,
        blockNumber: parseInt(transfer.block_number),
        timestamp: new Date(transfer.block_timestamp)
      }));
    } catch (error: any) {
      console.error('Error fetching NFT transfers:', error);
      throw new Error(`Failed to fetch NFT transfers: ${error.message}`);
    }
  }

  // Search NFTs by name or description
  async searchNFTs(query: string, chain: string = 'eth'): Promise<NFTCollection[]> {
    await this.ensureInitialized();
    
    try {
      const response = await Moralis.EvmApi.nft.searchNFTs({
        q: query,
        chain,
        format: 'decimal',
        limit: 20
      });

      const results = response.toJSON();
      
      return (results.result || []).map((collection: any) => ({
        contractAddress: collection.token_address,
        name: collection.name || 'Unknown',
        symbol: collection.symbol || '',
        contractType: collection.contract_type || 'ERC721'
      }));
    } catch (error: any) {
      console.error('Error searching NFTs:', error);
      throw new Error(`Failed to search NFTs: ${error.message}`);
    }
  }

  // Get NFT collection stats
  async getCollectionStats(contractAddress: string, chain: string = 'eth'): Promise<NFTCollectionStats> {
    await this.ensureInitialized();
    
    try {
      const response = await Moralis.EvmApi.nft.getNFTContractMetadata({
        address: contractAddress,
        chain
      });

      const metadata = response.toJSON();

      return {
        contractAddress,
        name: metadata.name || 'Unknown',
        symbol: metadata.symbol || '',
        totalSupply: parseInt(metadata.total_supply || '0'),
        contractType: metadata.contract_type || 'ERC721',
        syncedAt: new Date(metadata.synced_at || Date.now())
      };
    } catch (error: any) {
      console.error('Error fetching collection stats:', error);
      throw new Error(`Failed to fetch collection stats: ${error.message}`);
    }
  }

  // Get NFT owners
  async getNFTOwners(
    contractAddress: string,
    chain: string = 'eth'
  ): Promise<{ address: string; balance: number }[]> {
    await this.ensureInitialized();
    
    try {
      const response = await Moralis.EvmApi.nft.getNFTOwners({
        address: contractAddress,
        chain,
        format: 'decimal',
        limit: 100
      });

      const owners = response.toJSON();
      
      return (owners.result || []).map((owner: any) => ({
        address: owner.owner_of,
        balance: parseInt(owner.amount || '1')
      }));
    } catch (error: any) {
      console.error('Error fetching NFT owners:', error);
      throw new Error(`Failed to fetch NFT owners: ${error.message}`);
    }
  }

  // Verify NFT ownership
  async verifyNFTOwnership(
    walletAddress: string,
    contractAddress: string,
    tokenId?: string,
    chain: string = 'eth'
  ): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      if (tokenId) {
        // Check specific token ownership
        const metadata = await this.getNFTMetadata(contractAddress, tokenId, chain);
        return metadata.owner.toLowerCase() === walletAddress.toLowerCase();
      } else {
        // Check if wallet owns any token from the collection
        const nfts = await this.getNFTsByOwner(walletAddress, chain);
        return nfts.some(nft => 
          nft.contractAddress.toLowerCase() === contractAddress.toLowerCase()
        );
      }
    } catch (error: any) {
      console.error('Error verifying NFT ownership:', error);
      return false;
    }
  }

  // Get NFT price history (requires Moralis Pro)
  async getNFTPriceHistory(
    contractAddress: string,
    tokenId: string,
    chain: string = 'eth'
  ): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      const response = await Moralis.EvmApi.nft.getNFTTrades({
        address: contractAddress,
        tokenId,
        chain,
        limit: 50
      });

      const trades = response.toJSON();
      
      return (trades.result || []).map((trade: any) => ({
        price: trade.price,
        currency: trade.token_symbol || 'ETH',
        timestamp: new Date(trade.block_timestamp),
        from: trade.seller_address,
        to: trade.buyer_address,
        marketplace: trade.marketplace_name
      }));
    } catch (error: any) {
      console.error('Error fetching NFT price history:', error);
      // This might require Moralis Pro subscription
      return [];
    }
  }

  // Helper method to resolve IPFS URLs
  private resolveImageUrl(imageUrl?: string): string {
    if (!imageUrl) return '';
    
    // Handle IPFS URLs
    if (imageUrl.startsWith('ipfs://')) {
      // You can use different IPFS gateways
      return imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Handle Arweave URLs
    if (imageUrl.startsWith('ar://')) {
      return imageUrl.replace('ar://', 'https://arweave.net/');
    }
    
    return imageUrl;
  }

  // Parse NFT attributes
  private parseAttributes(attributes?: any): any[] {
    if (!attributes) return [];
    
    if (Array.isArray(attributes)) {
      return attributes.map(attr => ({
        trait_type: attr.trait_type || attr.key || 'Unknown',
        value: attr.value || '',
        display_type: attr.display_type
      }));
    }
    
    // Handle object-based attributes
    if (typeof attributes === 'object') {
      return Object.entries(attributes).map(([key, value]) => ({
        trait_type: key,
        value: value,
        display_type: typeof value === 'number' ? 'number' : 'string'
      }));
    }
    
    return [];
  }

  // Get supported chains
  static getSupportedChains(): string[] {
    return [
      'eth',        // Ethereum
      'goerli',     // Goerli testnet
      'sepolia',    // Sepolia testnet
      'polygon',    // Polygon
      'mumbai',     // Mumbai testnet
      'bsc',        // Binance Smart Chain
      'bsc testnet',// BSC testnet
      'avalanche',  // Avalanche
      'fantom',     // Fantom
      'arbitrum',   // Arbitrum
      'optimism',   // Optimism
      'base',       // Base
      'zksync'      // zkSync
    ];
  }
}