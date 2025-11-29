import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";
import { tokenGatingMiddleware } from "../middleware/token-gating";
import { nftService } from "../services/nft";
import { web3Service } from "../services/web3";

interface MarketplaceFilters {
  collection?: string;
  minPrice?: string;
  maxPrice?: string;
  currency?: 'ETH' | 'CRYB' | 'USDC';
  category?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  traits?: Record<string, string>;
  listed?: boolean;
  owner?: string;
  sortBy?: 'price_low' | 'price_high' | 'newest' | 'oldest' | 'popular' | 'ending_soon';
}

const marketplaceRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get marketplace listings with advanced filtering
  fastify.get("/listings", async (request: any, reply) => {
    try {
      const query = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        collection: z.string().optional(),
        minPrice: z.string().optional(),
        maxPrice: z.string().optional(),
        currency: z.enum(['ETH', 'CRYB', 'USDC']).optional(),
        category: z.string().optional(),
        rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).optional(),
        traits: z.string().optional(), // JSON string of traits
        owner: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['price_low', 'price_high', 'newest', 'oldest', 'popular', 'ending_soon']).default('newest'),
        status: z.enum(['active', 'sold', 'expired', 'cancelled']).default('active')
      }).parse(request.query);

      const offset = (query.page - 1) * query.limit;
      
      // Build filter conditions
      const where: any = {
        status: query.status.toUpperCase(),
      };

      if (query.collection) {
        where.nft = {
          collection: {
            contractAddress: {
              contains: query.collection,
              mode: 'insensitive'
            }
          }
        };
      }

      if (query.owner) {
        where.seller = {
          walletAddress: {
            equals: query.owner.toLowerCase(),
            mode: 'insensitive'
          }
        };
      }

      if (query.minPrice || query.maxPrice) {
        where.price = {};
        if (query.minPrice) where.price.gte = query.minPrice;
        if (query.maxPrice) where.price.lte = query.maxPrice;
      }

      if (query.currency) {
        where.currency = query.currency;
      }

      if (query.search) {
        where.OR = [
          {
            nft: {
              name: {
                contains: query.search,
                mode: 'insensitive'
              }
            }
          },
          {
            nft: {
              description: {
                contains: query.search,
                mode: 'insensitive'
              }
            }
          },
          {
            nft: {
              collection: {
                name: {
                  contains: query.search,
                  mode: 'insensitive'
                }
              }
            }
          }
        ];
      }

      // Build sorting
      let orderBy: any = { createdAt: 'desc' };
      switch (query.sortBy) {
        case 'price_low':
          orderBy = { price: 'asc' };
          break;
        case 'price_high':
          orderBy = { price: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'ending_soon':
          orderBy = { expiresAt: 'asc' };
          break;
        case 'popular':
          orderBy = { viewCount: 'desc' };
          break;
      }

      const [listings, total] = await Promise.all([
        prisma.nFTListing.findMany({
          where,
          orderBy,
          skip: offset,
          take: query.limit,
          include: {
            nft: {
              include: {
                collection: true,
              }
            },
            seller: {
              select: {
                id: true,
                username: true,
                avatar: true,
                walletAddress: true
              }
            }
          }
        }),
        prisma.nFTListing.count({ where })
      ]);

      // Parse traits filter if provided
      let traitsFilter: Record<string, string> | undefined;
      if (query.traits) {
        try {
          traitsFilter = JSON.parse(query.traits);
        } catch (error) {
          // Ignore invalid JSON
        }
      }

      // Filter by traits if specified
      const filteredListings = traitsFilter 
        ? listings.filter(listing => {
            if (!listing.nft.attributes) return false;
            const attributes = typeof listing.nft.attributes === 'string' 
              ? JSON.parse(listing.nft.attributes) 
              : listing.nft.attributes;
            
            return Object.entries(traitsFilter!).every(([trait, value]) => {
              return Array.isArray(attributes) && 
                     attributes.some((attr: any) => 
                       attr.trait_type === trait && attr.value?.toString() === value
                     );
            });
          })
        : listings;

      return reply.send({
        success: true,
        data: {
          listings: filteredListings.map(listing => ({
            id: listing.id,
            tokenId: listing.tokenId,
            price: listing.price,
            currency: listing.currency,
            status: listing.status,
            createdAt: listing.createdAt,
            expiresAt: listing.expiresAt,
            viewCount: listing.viewCount,
            favoriteCount: listing.favoriteCount,
            nft: {
              id: listing.nft.id,
              name: listing.nft.name,
              description: listing.nft.description,
              image: listing.nft.image,
              animationUrl: listing.nft.animationUrl,
              attributes: listing.nft.attributes,
              rarity: listing.nft.rarity,
              collection: {
                id: listing.nft.collection.id,
                name: listing.nft.collection.name,
                symbol: listing.nft.collection.symbol,
                contractAddress: listing.nft.collection.contractAddress,
                chain: listing.nft.collection.chain,
                image: listing.nft.collection.image,
                verified: listing.nft.collection.verified
              }
            },
            seller: {
              id: listing.seller.id,
              username: listing.seller.username,
              avatar: listing.seller.avatar,
              walletAddress: listing.seller.walletAddress
            }
          })),
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            pages: Math.ceil(total / query.limit)
          }
        }
      });
    } catch (error) {
      fastify.log.error("Failed to get marketplace listings:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get marketplace listings"
      });
    }
  });

  // Get specific listing details
  fastify.get("/listings/:listingId", async (request: any, reply) => {
    try {
      const params = z.object({
        listingId: z.string()
      }).parse(request.params);

      const listing = await prisma.nFTListing.findUnique({
        where: { id: params.listingId },
        include: {
          nft: {
            include: {
              collection: true,
            }
          },
          seller: {
            select: {
              id: true,
              username: true,
              avatar: true,
              walletAddress: true,
              createdAt: true
            }
          },
          offers: {
            where: { status: 'PENDING' },
            orderBy: { price: 'desc' },
            take: 10,
            include: {
              buyer: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  walletAddress: true
                }
              }
            }
          }
        }
      });

      if (!listing) {
        return reply.code(404).send({
          success: false,
          error: "Listing not found"
        });
      }

      // Increment view count
      await prisma.nFTListing.update({
        where: { id: params.listingId },
        data: { viewCount: { increment: 1 } }
      }).catch(() => {
        // Ignore errors for view count updates
      });

      // Get price history
      const priceHistory = await prisma.nFTSale.findMany({
        where: {
          nft: {
            tokenId: listing.tokenId,
            collection: {
              contractAddress: listing.nft.collection.contractAddress
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          price: true,
          currency: true,
          createdAt: true,
          buyer: {
            select: {
              username: true,
              walletAddress: true
            }
          },
          seller: {
            select: {
              username: true,
              walletAddress: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: {
          ...listing,
          priceHistory
        }
      });
    } catch (error) {
      fastify.log.error("Failed to get listing details:", error);
      
      return reply.code(500).send({
        success: false,
        error: "Failed to get listing details"
      });
    }
  });

  // Create new listing (protected by auth)
  fastify.post("/listings", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
        tokenId: z.string(),
        price: z.string().regex(/^\d+(\.\d+)?$/, "Invalid price format"),
        currency: z.enum(['ETH', 'CRYB', 'USDC']).default('ETH'),
        duration: z.number().min(1).max(365).default(7), // days
        royaltyPercentage: z.number().min(0).max(10).default(0),
        description: z.string().max(1000).optional()
      }).parse(request.body);

      // Verify NFT ownership
      const ownershipResult = await nftService.verifyNFTOwnership(
        body.contractAddress,
        body.tokenId,
        request.userId,
        'ethereum' // Default to Ethereum
      );

      if (!ownershipResult.isOwner) {
        return reply.code(403).send({
          success: false,
          error: "You don't own this NFT"
        });
      }

      // Get or create NFT record
      let nft = await prisma.nFT.findFirst({
        where: {
          tokenId: body.tokenId,
          collection: {
            contractAddress: body.contractAddress.toLowerCase()
          }
        },
        include: { collection: true }
      });

      if (!nft) {
        // Create NFT record from blockchain data
        const nftData = await nftService.getNFTMetadata(body.contractAddress, body.tokenId);
        
        let collection = await prisma.nFTCollection.findUnique({
          where: {
            contractAddress_chain: {
              contractAddress: body.contractAddress.toLowerCase(),
              chain: 'ethereum'
            }
          }
        });

        if (!collection) {
          collection = await prisma.nFTCollection.create({
            data: {
              contractAddress: body.contractAddress.toLowerCase(),
              name: nftData.collection?.name || 'Unknown Collection',
              symbol: nftData.collection?.symbol || 'UNKNOWN',
              chain: 'ethereum',
              verified: false
            }
          });
        }

        nft = await prisma.nFT.create({
          data: {
            tokenId: body.tokenId,
            name: nftData.name || `Token #${body.tokenId}`,
            description: nftData.description,
            image: nftData.image,
            animationUrl: nftData.animation_url,
            attributes: JSON.stringify(nftData.attributes || []),
            collectionId: collection.id,
            rarity: calculateRarity(nftData.attributes || [])
          },
          include: { collection: true }
        });
      }

      // Check for existing active listing
      const existingListing = await prisma.nFTListing.findFirst({
        where: {
          nftId: nft.id,
          sellerId: request.userId,
          status: 'ACTIVE'
        }
      });

      if (existingListing) {
        return reply.code(409).send({
          success: false,
          error: "This NFT is already listed for sale"
        });
      }

      // Create listing
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + body.duration);

      const listing = await prisma.nFTListing.create({
        data: {
          nftId: nft.id,
          sellerId: request.userId,
          tokenId: body.tokenId,
          price: body.price,
          currency: body.currency,
          expiresAt,
          royaltyPercentage: body.royaltyPercentage,
          description: body.description,
          status: 'ACTIVE'
        },
        include: {
          nft: {
            include: {
              collection: true
            }
          },
          seller: {
            select: {
              id: true,
              username: true,
              avatar: true,
              walletAddress: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: listing
      });
    } catch (error) {
      fastify.log.error("Failed to create listing:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to create listing"
      });
    }
  });

  // Cancel listing
  fastify.delete("/listings/:listingId", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const params = z.object({
        listingId: z.string()
      }).parse(request.params);

      const listing = await prisma.nFTListing.findUnique({
        where: { id: params.listingId }
      });

      if (!listing) {
        return reply.code(404).send({
          success: false,
          error: "Listing not found"
        });
      }

      if (listing.sellerId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Not authorized to cancel this listing"
        });
      }

      if (listing.status !== 'ACTIVE') {
        return reply.code(409).send({
          success: false,
          error: "Listing is not active"
        });
      }

      await prisma.nFTListing.update({
        where: { id: params.listingId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      return reply.send({
        success: true,
        data: {
          message: "Listing cancelled successfully"
        }
      });
    } catch (error) {
      fastify.log.error("Failed to cancel listing:", error);
      
      return reply.code(500).send({
        success: false,
        error: "Failed to cancel listing"
      });
    }
  });

  // Make offer on NFT
  fastify.post("/offers", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        listingId: z.string(),
        price: z.string().regex(/^\d+(\.\d+)?$/, "Invalid price format"),
        currency: z.enum(['ETH', 'CRYB', 'USDC']).default('ETH'),
        expiresIn: z.number().min(1).max(30).default(7), // days
        message: z.string().max(500).optional()
      }).parse(request.body);

      const listing = await prisma.nFTListing.findUnique({
        where: { id: body.listingId },
        include: {
          seller: true
        }
      });

      if (!listing) {
        return reply.code(404).send({
          success: false,
          error: "Listing not found"
        });
      }

      if (listing.status !== 'ACTIVE') {
        return reply.code(409).send({
          success: false,
          error: "Listing is not active"
        });
      }

      if (listing.sellerId === request.userId) {
        return reply.code(409).send({
          success: false,
          error: "Cannot make offer on your own listing"
        });
      }

      // Check for existing pending offer from this user
      const existingOffer = await prisma.nFTOffer.findFirst({
        where: {
          listingId: body.listingId,
          buyerId: request.userId,
          status: 'PENDING'
        }
      });

      if (existingOffer) {
        return reply.code(409).send({
          success: false,
          error: "You already have a pending offer on this NFT"
        });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + body.expiresIn);

      const offer = await prisma.nFTOffer.create({
        data: {
          listingId: body.listingId,
          buyerId: request.userId,
          price: body.price,
          currency: body.currency,
          expiresAt,
          message: body.message,
          status: 'PENDING'
        },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              avatar: true,
              walletAddress: true
            }
          },
          listing: {
            include: {
              nft: {
                include: {
                  collection: true
                }
              }
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: offer
      });
    } catch (error) {
      fastify.log.error("Failed to create offer:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to create offer"
      });
    }
  });

  // Accept/reject offer (seller only)
  fastify.put("/offers/:offerId", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const params = z.object({
        offerId: z.string()
      }).parse(request.params);

      const body = z.object({
        action: z.enum(['accept', 'reject'])
      }).parse(request.body);

      const offer = await prisma.nFTOffer.findUnique({
        where: { id: params.offerId },
        include: {
          listing: {
            include: {
              seller: true,
              nft: {
                include: {
                  collection: true
                }
              }
            }
          },
          buyer: true
        }
      });

      if (!offer) {
        return reply.code(404).send({
          success: false,
          error: "Offer not found"
        });
      }

      if (offer.listing.sellerId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Not authorized to respond to this offer"
        });
      }

      if (offer.status !== 'PENDING') {
        return reply.code(409).send({
          success: false,
          error: "Offer is no longer pending"
        });
      }

      const updatedOffer = await prisma.nFTOffer.update({
        where: { id: params.offerId },
        data: {
          status: body.action === 'accept' ? 'ACCEPTED' : 'REJECTED',
          respondedAt: new Date()
        }
      });

      if (body.action === 'accept') {
        // Create sale record
        await prisma.nFTSale.create({
          data: {
            nftId: offer.listing.nftId,
            sellerId: offer.listing.sellerId,
            buyerId: offer.buyerId,
            price: offer.price,
            currency: offer.currency,
            transactionHash: '', // Will be updated when transaction is confirmed
            royaltyAmount: (parseFloat(offer.price) * (offer.listing.royaltyPercentage / 100)).toString()
          }
        });

        // Update listing status
        await prisma.nFTListing.update({
          where: { id: offer.listingId },
          data: { status: 'SOLD' }
        });

        // Reject other pending offers
        await prisma.nFTOffer.updateMany({
          where: {
            listingId: offer.listingId,
            status: 'PENDING',
            id: { not: params.offerId }
          },
          data: { status: 'REJECTED' }
        });
      }

      return reply.send({
        success: true,
        data: {
          offer: updatedOffer,
          message: body.action === 'accept' ? 'Offer accepted' : 'Offer rejected'
        }
      });
    } catch (error) {
      fastify.log.error("Failed to respond to offer:", error);
      
      return reply.code(500).send({
        success: false,
        error: "Failed to respond to offer"
      });
    }
  });

  // Get collections with stats
  fastify.get("/collections", async (request: any, reply) => {
    try {
      const query = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(50).default(20),
        sortBy: z.enum(['volume', 'floor_price', 'name', 'created']).default('volume'),
        verified: z.coerce.boolean().optional(),
        search: z.string().optional()
      }).parse(request.query);

      const offset = (query.page - 1) * query.limit;
      
      let where: any = {};
      
      if (query.verified !== undefined) {
        where.verified = query.verified;
      }

      if (query.search) {
        where.OR = [
          {
            name: {
              contains: query.search,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: query.search,
              mode: 'insensitive'
            }
          }
        ];
      }

      const collections = await prisma.nFTCollection.findMany({
        where,
        skip: offset,
        take: query.limit,
        include: {
          _count: {
            select: {
              nfts: true
            }
          }
        }
      });

      // Get collection stats
      const collectionsWithStats = await Promise.all(
        collections.map(async (collection) => {
          const stats = await prisma.nFTSale.aggregate({
            where: {
              nft: {
                collectionId: collection.id
              },
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            },
            _sum: {
              price: true
            },
            _count: {
              id: true
            }
          });

          const floorPrice = await prisma.nFTListing.findFirst({
            where: {
              nft: {
                collectionId: collection.id
              },
              status: 'ACTIVE'
            },
            orderBy: {
              price: 'asc'
            },
            select: {
              price: true,
              currency: true
            }
          });

          return {
            ...collection,
            stats: {
              totalVolume: stats._sum.price || '0',
              salesCount: stats._count,
              itemCount: collection._count.nfts,
              floorPrice: floorPrice?.price || null,
              floorPriceCurrency: floorPrice?.currency || null
            }
          };
        })
      );

      return reply.send({
        success: true,
        data: {
          collections: collectionsWithStats,
          pagination: {
            page: query.page,
            limit: query.limit,
            total: collections.length
          }
        }
      });
    } catch (error) {
      fastify.log.error("Failed to get collections:", error);
      
      return reply.code(500).send({
        success: false,
        error: "Failed to get collections"
      });
    }
  });

  // Get user's NFT portfolio
  fastify.get("/portfolio/:userId", async (request: any, reply) => {
    try {
      const params = z.object({
        userId: z.string()
      }).parse(request.params);

      const query = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        collection: z.string().optional(),
        listed: z.coerce.boolean().optional()
      }).parse(request.query);

      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: {
          id: true,
          username: true,
          walletAddress: true
        }
      });

      if (!user?.walletAddress) {
        return reply.code(404).send({
          success: false,
          error: "User not found or no wallet connected"
        });
      }

      // Get user's NFTs
      const offset = (query.page - 1) * query.limit;
      let where: any = {
        owner: {
          walletAddress: user.walletAddress.toLowerCase()
        }
      };

      if (query.collection) {
        where.collection = {
          contractAddress: {
            contains: query.collection,
            mode: 'insensitive'
          }
        };
      }

      if (query.listed !== undefined) {
        if (query.listed) {
          where.listings = {
            some: {
              status: 'ACTIVE'
            }
          };
        } else {
          where.listings = {
            none: {
              status: 'ACTIVE'
            }
          };
        }
      }

      const [nfts, total] = await Promise.all([
        prisma.nFT.findMany({
          where,
          skip: offset,
          take: query.limit,
          include: {
            collection: true,
            listings: {
              where: { status: 'ACTIVE' },
              take: 1
            },
            owner: {
              select: {
                id: true,
                username: true,
                walletAddress: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.nFT.count({ where })
      ]);

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            walletAddress: user.walletAddress
          },
          nfts: nfts.map(nft => ({
            ...nft,
            isListed: nft.listings.length > 0,
            currentListing: nft.listings[0] || null
          })),
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            pages: Math.ceil(total / query.limit)
          }
        }
      });
    } catch (error) {
      fastify.log.error("Failed to get user portfolio:", error);
      
      return reply.code(500).send({
        success: false,
        error: "Failed to get user portfolio"
      });
    }
  });
};

/**
 * Calculate NFT rarity based on attributes
 */
function calculateRarity(attributes: any[]): string {
  if (!attributes || attributes.length === 0) return 'common';
  
  // Simple rarity calculation based on number of attributes
  // In production, this would use actual collection trait rarity data
  const score = attributes.length;
  
  if (score >= 8) return 'legendary';
  if (score >= 6) return 'epic';
  if (score >= 4) return 'rare';
  if (score >= 2) return 'uncommon';
  return 'common';
}

export default marketplaceRoutes;