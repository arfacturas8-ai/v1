import { prisma } from "@cryb/database";
import { ethers } from "ethers";
import axios from "axios";
import { providerManager } from "../../../../packages/web3/src/providers/ProviderManager";
import { 
  nftMetadataCache, 
  tokenBalanceCache, 
  blockchainDataCache 
} from "../../../../packages/web3/src/cache/CacheManager";

export interface NFTMetadata {
  name: string;
  description?: string;
  image?: string;
  animationUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: any;
    display_type?: string;
  }>;
}

export interface NFTOwnershipResult {
  isOwner: boolean;
  nft?: {
    id: string;
    tokenId: string;
    name: string;
    image?: string;
    metadata?: NFTMetadata;
  };
}

export interface CollectionInfo {
  contractAddress: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  chain: string;
  verified: boolean;
  floorPrice?: string;
  totalSupply?: number;
}

export class NFTService {
  private readonly ERC721_ABI = [
    "function name() external view returns (string memory)",
    "function symbol() external view returns (string memory)",
    "function tokenURI(uint256 tokenId) external view returns (string memory)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",
  ];

  private readonly ERC1155_ABI = [
    "function balanceOf(address account, uint256 id) external view returns (uint256)",
    "function uri(uint256 id) external view returns (string memory)",
  ];

  private async getProvider(chain: string = 'ethereum'): Promise<ethers.Provider> {
    try {
      return await providerManager.getProvider(chain);
    } catch (error) {
      console.error(`Failed to get provider for chain ${chain}:`, error);
      throw new Error(`Provider unavailable for chain: ${chain}`);
    }
  }

  /**
   * Verify NFT ownership with crash-safe error handling and provider failover
   */
  async verifyNFTOwnership(
    contractAddress: string,
    tokenId: string,
    userAddress: string,
    chain: string = 'ethereum'
  ): Promise<NFTOwnershipResult> {
    try {
      if (!ethers.isAddress(contractAddress) || !ethers.isAddress(userAddress)) {
        return { isOwner: false };
      }

      // Use provider manager with automatic failover
      return await providerManager.executeWithFailover(
        chain,
        async (provider) => {
          // Try ERC-721 first
          try {
            const contract = new ethers.Contract(contractAddress, this.ERC721_ABI, provider);
            
            const owner = await Promise.race([
              contract.ownerOf(tokenId),
              this.timeout(10000, 'ERC-721 ownerOf timeout')
            ]);
            
            const isOwner = owner.toLowerCase() === userAddress.toLowerCase();
            
            if (isOwner) {
              // Get token metadata with timeout
              const metadata = await Promise.race([
                this.fetchNFTMetadata(contractAddress, tokenId, chain),
                this.timeout(15000, 'Metadata fetch timeout')
              ]).catch(() => null);
              
              return {
                isOwner: true,
                nft: {
                  id: `${contractAddress}-${tokenId}`,
                  tokenId,
                  name: metadata?.name || `Token #${tokenId}`,
                  image: metadata?.image,
                  metadata
                }
              };
            }
            
            return { isOwner: false };
          } catch (erc721Error) {
            // Try ERC-1155
            try {
              const contract = new ethers.Contract(contractAddress, this.ERC1155_ABI, provider);
              
              const balance = await Promise.race([
                contract.balanceOf(userAddress, tokenId),
                this.timeout(10000, 'ERC-1155 balanceOf timeout')
              ]);
              
              const isOwner = balance > 0;
              
              if (isOwner) {
                const metadata = await Promise.race([
                  this.fetchNFTMetadata(contractAddress, tokenId, chain),
                  this.timeout(15000, 'Metadata fetch timeout')
                ]).catch(() => null);
                
                return {
                  isOwner: true,
                  nft: {
                    id: `${contractAddress}-${tokenId}`,
                    tokenId,
                    name: metadata?.name || `Token #${tokenId}`,
                    image: metadata?.image,
                    metadata
                  }
                };
              }
              
              return { isOwner: false };
            } catch (erc1155Error) {
              console.warn('NFT ownership verification failed for both ERC-721 and ERC-1155:', {
                contractAddress,
                tokenId,
                erc721Error: erc721Error instanceof Error ? erc721Error.message : 'Unknown error',
                erc1155Error: erc1155Error instanceof Error ? erc1155Error.message : 'Unknown error'
              });
              
              return { isOwner: false };
            }
          }
        },
        3 // Max retries with different providers
      );
    } catch (error) {
      console.error('Critical error in NFT ownership verification:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contractAddress,
        tokenId,
        userAddress,
        chain
      });
      
      return { isOwner: false };
    }
  }

  /**
   * Fetch NFT metadata with IPFS resolution, provider failover, and caching
   */
  async fetchNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chain: string = 'ethereum'
  ): Promise<NFTMetadata | null> {
    try {
      const cacheKey = nftMetadataCache.getCacheKey(contractAddress, tokenId, chain);
      
      // Try to get from cache first
      return await nftMetadataCache.getOrSet(cacheKey, async () => {
        // Use provider manager with automatic failover
        return await providerManager.executeWithFailover(
          chain,
          async (provider) => {
          // Try ERC-721 tokenURI
          let tokenUri: string;
          
          try {
            const contract = new ethers.Contract(contractAddress, this.ERC721_ABI, provider);
            tokenUri = await Promise.race([
              contract.tokenURI(tokenId),
              this.timeout(8000, 'ERC-721 tokenURI timeout')
            ]);
          } catch {
            // Try ERC-1155 uri
            try {
              const contract = new ethers.Contract(contractAddress, this.ERC1155_ABI, provider);
              tokenUri = await Promise.race([
                contract.uri(tokenId),
                this.timeout(8000, 'ERC-1155 uri timeout')
              ]);
              
              // Replace {id} placeholder in ERC-1155 URIs
              tokenUri = tokenUri.replace('{id}', tokenId.toString().padStart(64, '0'));
            } catch {
              return null;
            }
          }

          if (!tokenUri) {
            return null;
          }

          // Convert IPFS URLs with multiple gateway attempts
          const resolvedUri = this.resolveIPFS(tokenUri);
          
          // Try multiple IPFS gateways for better reliability
          const ipfsGateways = [
            'https://gateway.pinata.cloud/ipfs/',
            'https://ipfs.io/ipfs/',
            'https://cloudflare-ipfs.com/ipfs/',
            'https://dweb.link/ipfs/'
          ];
          
          for (const gateway of ipfsGateways) {
            try {
              const uri = tokenUri.startsWith('ipfs://') 
                ? tokenUri.replace('ipfs://', gateway)
                : resolvedUri;
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);
              
              const response = await axios.get(uri, {
                timeout: 8000,
                signal: controller.signal,
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'CRYB-Platform/1.0',
                  'Cache-Control': 'no-cache'
                },
                validateStatus: (status) => status < 500 // Retry on 5xx errors
              });
              
              clearTimeout(timeoutId);
              
              if (response.data) {
                const metadata: NFTMetadata = {
                  name: response.data.name || `Token #${tokenId}`,
                  description: response.data.description,
                  image: response.data.image ? this.resolveIPFS(response.data.image) : undefined,
                  animationUrl: response.data.animation_url ? this.resolveIPFS(response.data.animation_url) : undefined,
                  attributes: response.data.attributes || []
                };
                
                return metadata;
              }
            } catch (fetchError) {
              console.warn(`Failed to fetch from gateway ${gateway}:`, {
                uri: resolvedUri,
                error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
              });
              continue;
            }
          }
          
          // If all gateways fail, return basic metadata
          return {
            name: `Token #${tokenId}`,
            description: 'Metadata unavailable - IPFS gateways unresponsive',
            attributes: []
          };
          },
          2 // Fewer retries for metadata as it's not critical
        );
      });
    } catch (error) {
      console.error('Error fetching NFT metadata:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contractAddress,
        tokenId,
        chain
      });
      
      return {
        name: `Token #${tokenId}`,
        description: 'Metadata fetch failed',
        attributes: []
      };
    }
  }

  /**
   * Set user's NFT profile picture
   */
  async setNFTProfilePicture(
    userId: string,
    contractAddress: string,
    tokenId: string,
    chain: string = 'ethereum'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user's wallet address
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.walletAddress) {
        return { success: false, error: 'No wallet connected' };
      }

      // Verify ownership
      const ownership = await this.verifyNFTOwnership(
        contractAddress,
        tokenId,
        user.walletAddress,
        chain
      );

      if (!ownership.isOwner) {
        return { success: false, error: 'NFT not owned by user' };
      }

      // Get or create collection
      const collection = await this.getOrCreateCollection(contractAddress, chain);
      
      // Get or create NFT record
      const nft = await prisma.nFT.upsert({
        where: {
          collectionId_tokenId: {
            collectionId: collection.id,
            tokenId
          }
        },
        update: {
          ownerAddress: user.walletAddress.toLowerCase(),
          name: ownership.nft?.name || `Token #${tokenId}`,
          image: ownership.nft?.metadata?.image,
          description: ownership.nft?.metadata?.description,
          attributes: ownership.nft?.metadata?.attributes || null,
          metadata: ownership.nft?.metadata || null,
          updatedAt: new Date()
        },
        create: {
          collectionId: collection.id,
          tokenId,
          name: ownership.nft?.name || `Token #${tokenId}`,
          image: ownership.nft?.metadata?.image,
          description: ownership.nft?.metadata?.description,
          attributes: ownership.nft?.metadata?.attributes || null,
          metadata: ownership.nft?.metadata || null,
          ownerAddress: user.walletAddress.toLowerCase()
        }
      });

      // Create or update UserNFT record
      await prisma.userNFT.upsert({
        where: {
          userId_nftId: {
            userId,
            nftId: nft.id
          }
        },
        update: {
          verified: true,
          lastVerifiedAt: new Date()
        },
        create: {
          userId,
          nftId: nft.id,
          verified: true,
          lastVerifiedAt: new Date()
        }
      });

      // Set as profile picture (remove any existing ones)
      await prisma.userProfilePicture.deleteMany({
        where: { userId }
      });

      await prisma.userProfilePicture.create({
        data: {
          userId,
          nftId: nft.id,
          isActive: true
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error setting NFT profile picture:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        contractAddress,
        tokenId,
        chain
      });
      
      return { 
        success: false, 
        error: 'Failed to set NFT profile picture' 
      };
    }
  }

  /**
   * Get user's NFT profile picture
   */
  async getUserNFTProfilePicture(userId: string) {
    try {
      const profilePicture = await prisma.userProfilePicture.findUnique({
        where: { userId },
        include: {
          nft: {
            include: {
              collection: true
            }
          }
        }
      });

      if (!profilePicture?.isActive) {
        return null;
      }

      return {
        id: profilePicture.id,
        nft: {
          id: profilePicture.nft.id,
          tokenId: profilePicture.nft.tokenId,
          name: profilePicture.nft.name,
          image: profilePicture.nft.image,
          description: profilePicture.nft.description,
          attributes: profilePicture.nft.attributes,
          collection: {
            id: profilePicture.nft.collection.id,
            name: profilePicture.nft.collection.name,
            contractAddress: profilePicture.nft.collection.contractAddress,
            chain: profilePicture.nft.collection.chain,
            verified: profilePicture.nft.collection.verified
          }
        }
      };
    } catch (error) {
      console.error('Error getting user NFT profile picture:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      
      return null;
    }
  }

  /**
   * Get user's verified NFTs
   */
  async getUserNFTs(userId: string, page: number = 1, limit: number = 20) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.walletAddress) {
        return { nfts: [], totalCount: 0 };
      }

      const userNfts = await prisma.userNFT.findMany({
        where: {
          userId,
          verified: true
        },
        include: {
          nft: {
            include: {
              collection: true
            }
          }
        },
        orderBy: {
          lastVerifiedAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      });

      const totalCount = await prisma.userNFT.count({
        where: {
          userId,
          verified: true
        }
      });

      const nfts = userNfts.map(userNft => ({
        id: userNft.nft.id,
        tokenId: userNft.nft.tokenId,
        name: userNft.nft.name,
        image: userNft.nft.image,
        description: userNft.nft.description,
        attributes: userNft.nft.attributes,
        rarity: userNft.nft.rarity,
        lastSalePrice: userNft.nft.lastSalePrice,
        collection: {
          id: userNft.nft.collection.id,
          name: userNft.nft.collection.name,
          contractAddress: userNft.nft.collection.contractAddress,
          chain: userNft.nft.collection.chain,
          verified: userNft.nft.collection.verified,
          image: userNft.nft.collection.image
        },
        verifiedAt: userNft.lastVerifiedAt
      }));

      return { nfts, totalCount };
    } catch (error) {
      console.error('Error getting user NFTs:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      
      return { nfts: [], totalCount: 0 };
    }
  }

  /**
   * Remove NFT profile picture
   */
  async removeNFTProfilePicture(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.userProfilePicture.deleteMany({
        where: { userId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing NFT profile picture:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      
      return { 
        success: false, 
        error: 'Failed to remove NFT profile picture' 
      };
    }
  }

  /**
   * Get or create NFT collection
   */
  private async getOrCreateCollection(contractAddress: string, chain: string = 'ethereum') {
    const normalizedAddress = contractAddress.toLowerCase();
    
    let collection = await prisma.nFTCollection.findUnique({
      where: {
        contractAddress_chain: {
          contractAddress: normalizedAddress,
          chain
        }
      }
    });

    if (!collection) {
      // Fetch collection info from blockchain
      const collectionInfo = await this.fetchCollectionInfo(contractAddress, chain);
      
      collection = await prisma.nFTCollection.create({
        data: {
          contractAddress: normalizedAddress,
          name: collectionInfo.name,
          symbol: collectionInfo.symbol,
          description: collectionInfo.description,
          image: collectionInfo.image,
          bannerImage: collectionInfo.bannerImage,
          chain,
          verified: collectionInfo.verified,
          floorPrice: collectionInfo.floorPrice,
          totalSupply: collectionInfo.totalSupply
        }
      });
    }

    return collection;
  }

  /**
   * Fetch collection information from blockchain with provider failover
   */
  private async fetchCollectionInfo(contractAddress: string, chain: string): Promise<CollectionInfo> {
    try {
      return await providerManager.executeWithFailover(
        chain,
        async (provider) => {
          const contract = new ethers.Contract(contractAddress, this.ERC721_ABI, provider);
          
          const [name, symbol] = await Promise.all([
            Promise.race([
              contract.name(),
              this.timeout(5000, 'Contract name timeout')
            ]).catch(() => 'Unknown Collection'),
            Promise.race([
              contract.symbol(),
              this.timeout(5000, 'Contract symbol timeout')
            ]).catch(() => 'UNKNOWN')
          ]);

          let totalSupply: number | undefined;
          try {
            const supply = await Promise.race([
              contract.totalSupply(),
              this.timeout(5000, 'Total supply timeout')
            ]);
            totalSupply = parseInt(supply.toString());
          } catch {
            // totalSupply not available - this is common for many contracts
          }

          return {
            contractAddress: contractAddress.toLowerCase(),
            name,
            symbol,
            chain,
            verified: false, // Manual verification required
            totalSupply
          };
        },
        2 // Max retries for collection info
      );
    } catch (error) {
      console.warn('Error fetching collection info:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contractAddress,
        chain
      });
      
      return {
        contractAddress: contractAddress.toLowerCase(),
        name: 'Unknown Collection',
        symbol: 'UNKNOWN',
        chain,
        verified: false
      };
    }
  }

  /**
   * Resolve IPFS URLs to gateway URLs with multiple gateway support
   */
  private resolveIPFS(uri: string): string {
    if (!uri) return uri;
    
    if (uri.startsWith('ipfs://')) {
      const ipfsHash = uri.replace('ipfs://', '');
      // Use Pinata as primary gateway (generally more reliable)
      return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    }
    
    if (uri.startsWith('ar://')) {
      const arweaveId = uri.replace('ar://', '');
      return `https://arweave.net/${arweaveId}`;
    }
    
    // Handle data URIs
    if (uri.startsWith('data:')) {
      return uri;
    }
    
    // Handle relative IPFS paths
    if (uri.startsWith('/ipfs/')) {
      return `https://gateway.pinata.cloud${uri}`;
    }
    
    return uri;
  }

  /**
   * Create a timeout promise
   */
  private timeout<T>(ms: number, message: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Bulk verify user's NFTs from their wallet using Moralis or similar service
   */
  async bulkVerifyUserNFTs(userId: string): Promise<{ verifiedCount: number; errors: string[] }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.walletAddress) {
        return { verifiedCount: 0, errors: ['No wallet connected'] };
      }

      let verifiedCount = 0;
      const errors: string[] = [];

      // Get user's existing NFT records to verify
      const userNfts = await prisma.userNFT.findMany({
        where: { userId },
        include: {
          nft: {
            include: {
              collection: true
            }
          }
        }
      });

      // Verify each NFT in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < userNfts.length; i += batchSize) {
        const batch = userNfts.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (userNft) => {
            try {
              const ownership = await this.verifyNFTOwnership(
                userNft.nft.collection.contractAddress,
                userNft.nft.tokenId,
                user.walletAddress!,
                userNft.nft.collection.chain
              );

              if (ownership.isOwner) {
                await prisma.userNFT.update({
                  where: { id: userNft.id },
                  data: {
                    verified: true,
                    lastVerifiedAt: new Date()
                  }
                });
                verifiedCount++;
              } else {
                // NFT no longer owned, mark as unverified
                await prisma.userNFT.update({
                  where: { id: userNft.id },
                  data: {
                    verified: false,
                    lastVerifiedAt: new Date()
                  }
                });
              }
            } catch (error) {
              errors.push(
                `Failed to verify NFT ${userNft.nft.collection.contractAddress}:${userNft.nft.tokenId} - ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          })
        );

        // Small delay between batches to be respectful to RPC providers
        if (i + batchSize < userNfts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return { verifiedCount, errors };
    } catch (error) {
      console.error('Error in bulk NFT verification:', error);
      return { verifiedCount: 0, errors: ['Failed to verify NFTs'] };
    }
  }
}

export const nftService = new NFTService();