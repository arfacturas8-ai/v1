import { prisma } from "@cryb/database";
import { ethers } from "ethers";
import axios from "axios";

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

export class SimpleNFTService {
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

  private getProvider(chainId: number = 1): ethers.JsonRpcProvider {
    const rpcUrls: Record<number, string> = {
      1: process.env.ETHEREUM_RPC_URL || `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
      56: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org'
    };
    
    const rpcUrl = rpcUrls[chainId] || rpcUrls[1];
    return new ethers.JsonRpcProvider(rpcUrl);
  }

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

      const chainId = this.getChainId(chain);
      const provider = this.getProvider(chainId);

      // Try ERC-721 first
      try {
        const contract = new ethers.Contract(contractAddress, this.ERC721_ABI, provider);
        const owner = await contract.ownerOf(tokenId);
        const isOwner = owner.toLowerCase() === userAddress.toLowerCase();
        
        if (isOwner) {
          const metadata = await this.fetchNFTMetadata(contractAddress, tokenId, chain).catch(() => null);
          
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
          const balance = await contract.balanceOf(userAddress, tokenId);
          const isOwner = balance > 0;
          
          if (isOwner) {
            const metadata = await this.fetchNFTMetadata(contractAddress, tokenId, chain).catch(() => null);
            
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
          console.warn('NFT ownership verification failed for both standards:', {
            contractAddress,
            tokenId,
            erc721Error: erc721Error instanceof Error ? erc721Error.message : 'Unknown',
            erc1155Error: erc1155Error instanceof Error ? erc1155Error.message : 'Unknown'
          });
          
          return { isOwner: false };
        }
      }
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

  async fetchNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chain: string = 'ethereum'
  ): Promise<NFTMetadata | null> {
    try {
      const chainId = this.getChainId(chain);
      const provider = this.getProvider(chainId);

      // Try ERC-721 tokenURI
      let tokenUri: string;
      
      try {
        const contract = new ethers.Contract(contractAddress, this.ERC721_ABI, provider);
        tokenUri = await contract.tokenURI(tokenId);
      } catch {
        // Try ERC-1155 uri
        try {
          const contract = new ethers.Contract(contractAddress, this.ERC1155_ABI, provider);
          tokenUri = await contract.uri(tokenId);
          // Replace {id} placeholder in ERC-1155 URIs
          tokenUri = tokenUri.replace('{id}', tokenId.toString().padStart(64, '0'));
        } catch {
          return null;
        }
      }

      if (!tokenUri) {
        return null;
      }

      // Convert IPFS URLs
      const resolvedUri = this.resolveIPFS(tokenUri);
      
      // Fetch metadata with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await axios.get(resolvedUri, {
          timeout: 10000,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CRYB-Platform/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.data) {
          return {
            name: response.data.name || `Token #${tokenId}`,
            description: response.data.description,
            image: response.data.image ? this.resolveIPFS(response.data.image) : undefined,
            animationUrl: response.data.animation_url ? this.resolveIPFS(response.data.animation_url) : undefined,
            attributes: response.data.attributes || []
          };
        }
      } catch (fetchError) {
        console.warn('Failed to fetch metadata:', {
          uri: resolvedUri,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown'
        });
      } finally {
        clearTimeout(timeoutId);
      }
      
      return {
        name: `Token #${tokenId}`,
        description: 'Metadata unavailable',
        attributes: []
      };
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return {
        name: `Token #${tokenId}`,
        description: 'Metadata fetch failed',
        attributes: []
      };
    }
  }

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
      console.error('Error setting NFT profile picture:', error);
      return { 
        success: false, 
        error: 'Failed to set NFT profile picture' 
      };
    }
  }

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
      console.error('Error getting user NFT profile picture:', error);
      return null;
    }
  }

  async removeNFTProfilePicture(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.userProfilePicture.deleteMany({
        where: { userId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing NFT profile picture:', error);
      return { 
        success: false, 
        error: 'Failed to remove NFT profile picture' 
      };
    }
  }

  async getUserNFTs(userId: string, page: number = 1, limit: number = 20) {
    try {
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
      console.error('Error getting user NFTs:', error);
      return { nfts: [], totalCount: 0 };
    }
  }

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

      // Verify each NFT in small batches
      const batchSize = 3;
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
                await prisma.userNFT.update({
                  where: { id: userNft.id },
                  data: {
                    verified: false,
                    lastVerifiedAt: new Date()
                  }
                });
              }
            } catch (error) {
              errors.push(`Failed to verify NFT ${userNft.nft.collection.contractAddress}:${userNft.nft.tokenId}`);
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < userNfts.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return { verifiedCount, errors };
    } catch (error) {
      console.error('Error in bulk NFT verification:', error);
      return { verifiedCount: 0, errors: ['Failed to verify NFTs'] };
    }
  }

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
      const collectionInfo = await this.fetchCollectionInfo(contractAddress, chain);
      
      collection = await prisma.nFTCollection.create({
        data: {
          contractAddress: normalizedAddress,
          name: collectionInfo.name,
          symbol: collectionInfo.symbol,
          description: collectionInfo.description,
          image: collectionInfo.image,
          chain,
          verified: false,
          totalSupply: collectionInfo.totalSupply
        }
      });
    }

    return collection;
  }

  private async fetchCollectionInfo(contractAddress: string, chain: string) {
    try {
      const chainId = this.getChainId(chain);
      const provider = this.getProvider(chainId);
      const contract = new ethers.Contract(contractAddress, this.ERC721_ABI, provider);
      
      const [name, symbol] = await Promise.all([
        contract.name().catch(() => 'Unknown Collection'),
        contract.symbol().catch(() => 'UNKNOWN')
      ]);

      let totalSupply: number | undefined;
      try {
        const supply = await contract.totalSupply();
        totalSupply = parseInt(supply.toString());
      } catch {
        // totalSupply not available
      }

      return {
        name,
        symbol,
        totalSupply
      };
    } catch (error) {
      console.warn('Error fetching collection info:', error);
      return {
        name: 'Unknown Collection',
        symbol: 'UNKNOWN'
      };
    }
  }

  private resolveIPFS(uri: string): string {
    if (!uri) return uri;
    
    if (uri.startsWith('ipfs://')) {
      const ipfsHash = uri.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    }
    
    if (uri.startsWith('ar://')) {
      const arweaveId = uri.replace('ar://', '');
      return `https://arweave.net/${arweaveId}`;
    }
    
    if (uri.startsWith('data:')) {
      return uri;
    }
    
    if (uri.startsWith('/ipfs/')) {
      return `https://gateway.pinata.cloud${uri}`;
    }
    
    return uri;
  }

  private getChainId(chain: string): number {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      bsc: 56
    };
    return chainIds[chain] || 1;
  }
}

export const simpleNftService = new SimpleNFTService();