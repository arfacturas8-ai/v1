import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { simpleNftService } from "../services/simple-nft";
import { prisma } from "@cryb/database";

const nftRoutes: FastifyPluginAsync = async (fastify) => {
  // Verify NFT ownership
  fastify.post("/verify-ownership", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
        tokenId: z.string(),
        chain: z.string().default("ethereum"),
      }).parse(request.body);

      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user?.walletAddress) {
        return reply.code(400).send({
          success: false,
          error: "No wallet connected",
        });
      }

      const ownership = await simpleNftService.verifyNFTOwnership(
        body.contractAddress,
        body.tokenId,
        user.walletAddress,
        body.chain
      );

      return reply.send({
        success: true,
        data: ownership,
      });
    } catch (error) {
      fastify.log.error("NFT ownership verification failed:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to verify NFT ownership",
      });
    }
  });

  // Set NFT as profile picture
  fastify.post("/profile-picture", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
        tokenId: z.string(),
        chain: z.string().default("ethereum"),
      }).parse(request.body);

      const result = await simpleNftService.setNFTProfilePicture(
        request.userId,
        body.contractAddress,
        body.tokenId,
        body.chain
      );

      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }

      // Get updated profile picture data
      const profilePicture = await simpleNftService.getUserNFTProfilePicture(request.userId);

      return reply.send({
        success: true,
        data: {
          message: "NFT profile picture set successfully",
          profilePicture,
        },
      });
    } catch (error) {
      fastify.log.error("Failed to set NFT profile picture:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to set NFT profile picture",
      });
    }
  });

  // Get user's NFT profile picture
  fastify.get("/profile-picture", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const profilePicture = await simpleNftService.getUserNFTProfilePicture(request.userId);

      return reply.send({
        success: true,
        data: profilePicture,
      });
    } catch (error) {
      fastify.log.error("Failed to get NFT profile picture:", error);

      return reply.code(500).send({
        success: false,
        error: "Failed to get NFT profile picture",
      });
    }
  });

  // Get user's NFT profile picture by user ID (public)
  fastify.get("/profile-picture/:userId", async (request: any, reply) => {
    try {
      const params = z.object({
        userId: z.string(),
      }).parse(request.params);

      const profilePicture = await simpleNftService.getUserNFTProfilePicture(params.userId);

      return reply.send({
        success: true,
        data: profilePicture,
      });
    } catch (error) {
      fastify.log.error("Failed to get user NFT profile picture:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid user ID",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get NFT profile picture",
      });
    }
  });

  // Remove NFT profile picture
  fastify.delete("/profile-picture", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const result = await simpleNftService.removeNFTProfilePicture(request.userId);

      if (!result.success) {
        return reply.code(500).send({
          success: false,
          error: result.error,
        });
      }

      return reply.send({
        success: true,
        data: {
          message: "NFT profile picture removed successfully",
        },
      });
    } catch (error) {
      fastify.log.error("Failed to remove NFT profile picture:", error);

      return reply.code(500).send({
        success: false,
        error: "Failed to remove NFT profile picture",
      });
    }
  });

  // Get user's verified NFTs
  fastify.get("/my-nfts", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const query = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      }).parse(request.query);

      const result = await simpleNftService.getUserNFTs(request.userId, query.page, query.limit);

      return reply.send({
        success: true,
        data: {
          nfts: result.nfts,
          pagination: {
            page: query.page,
            limit: query.limit,
            totalCount: result.totalCount,
            totalPages: Math.ceil(result.totalCount / query.limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error("Failed to get user NFTs:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get user NFTs",
      });
    }
  });

  // Get NFT metadata
  fastify.get("/metadata", async (request: any, reply) => {
    try {
      const query = z.object({
        contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
        tokenId: z.string(),
        chain: z.string().default("ethereum"),
      }).parse(request.query);

      const metadata = await simpleNftService.fetchNFTMetadata(
        query.contractAddress,
        query.tokenId,
        query.chain
      );

      if (!metadata) {
        return reply.code(404).send({
          success: false,
          error: "NFT metadata not found",
        });
      }

      return reply.send({
        success: true,
        data: metadata,
      });
    } catch (error) {
      fastify.log.error("Failed to get NFT metadata:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get NFT metadata",
      });
    }
  });

  // Bulk verify user's NFTs
  fastify.post("/bulk-verify", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const result = await simpleNftService.bulkVerifyUserNFTs(request.userId);

      return reply.send({
        success: true,
        data: {
          verifiedCount: result.verifiedCount,
          errors: result.errors,
          message: `Successfully verified ${result.verifiedCount} NFTs`,
        },
      });
    } catch (error) {
      fastify.log.error("Failed to bulk verify NFTs:", error);

      return reply.code(500).send({
        success: false,
        error: "Failed to verify NFTs",
      });
    }
  });

  // Get collections
  fastify.get("/collections", async (request: any, reply) => {
    try {
      const query = z.object({
        chain: z.string().optional(),
        verified: z.coerce.boolean().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        search: z.string().optional(),
      }).parse(request.query);

      const where: any = {};

      if (query.chain) {
        where.chain = query.chain;
      }

      if (typeof query.verified === 'boolean') {
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
            symbol: {
              contains: query.search,
              mode: 'insensitive'
            }
          }
        ];
      }

      const [collections, totalCount] = await Promise.all([
        prisma.nFTCollection.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          include: {
            _count: {
              select: {
                nfts: true,
                marketplaceListings: true,
              },
            },
          },
        }),
        prisma.nFTCollection.count({ where }),
      ]);

      const collectionsWithStats = collections.map(collection => ({
        id: collection.id,
        contractAddress: collection.contractAddress,
        name: collection.name,
        symbol: collection.symbol,
        description: collection.description,
        image: collection.image,
        bannerImage: collection.bannerImage,
        chain: collection.chain,
        verified: collection.verified,
        floorPrice: collection.floorPrice,
        totalSupply: collection.totalSupply,
        createdAt: collection.createdAt,
        stats: {
          totalNFTs: collection._count.nfts,
          activeListings: collection._count.marketplaceListings,
        },
      }));

      return reply.send({
        success: true,
        data: {
          collections: collectionsWithStats,
          pagination: {
            page: query.page,
            limit: query.limit,
            totalCount,
            totalPages: Math.ceil(totalCount / query.limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error("Failed to get collections:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get collections",
      });
    }
  });

  // Get collection details
  fastify.get("/collections/:contractAddress", async (request: any, reply) => {
    try {
      const params = z.object({
        contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
      }).parse(request.params);

      const query = z.object({
        chain: z.string().default("ethereum"),
      }).parse(request.query);

      const collection = await prisma.nFTCollection.findUnique({
        where: {
          contractAddress_chain: {
            contractAddress: params.contractAddress.toLowerCase(),
            chain: query.chain,
          },
        },
        include: {
          nfts: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              nfts: true,
              marketplaceListings: true,
            },
          },
        },
      });

      if (!collection) {
        return reply.code(404).send({
          success: false,
          error: "Collection not found",
        });
      }

      const result = {
        id: collection.id,
        contractAddress: collection.contractAddress,
        name: collection.name,
        symbol: collection.symbol,
        description: collection.description,
        image: collection.image,
        bannerImage: collection.bannerImage,
        chain: collection.chain,
        verified: collection.verified,
        floorPrice: collection.floorPrice,
        totalSupply: collection.totalSupply,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        recentNFTs: collection.nfts,
        stats: {
          totalNFTs: collection._count.nfts,
          activeListings: collection._count.marketplaceListings,
        },
      };

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      fastify.log.error("Failed to get collection details:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get collection details",
      });
    }
  });
};

export default nftRoutes;