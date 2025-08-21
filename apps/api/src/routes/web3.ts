import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { 
  generateSiweMessage, 
  verifySiweMessage, 
  generateNonce,
  getTokenBalance,
  verifyNFTOwnership,
} from "@cryb/web3";
import { createSession } from "@cryb/auth";
import { authenticate } from "../middleware/auth";

export const web3Routes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/siwe/nonce", async (request, reply) => {
    const nonce = generateNonce();
    
    return reply.send({
      success: true,
      data: { nonce },
    });
  });

  fastify.post("/siwe/verify", async (request, reply) => {
    try {
      const body = z.object({
        message: z.string(),
        signature: z.string(),
      }).parse(request.body);

      const result = await verifySiweMessage(body.message, body.signature);

      if (!result.success || !result.data) {
        return reply.code(401).send({
          success: false,
          error: "Invalid signature",
        });
      }

      const address = result.data.address.toLowerCase();

      let user = await prisma.user.findUnique({
        where: { walletAddress: address },
      });

      if (!user) {
        const username = `user_${address.slice(0, 8)}`;
        user = await prisma.user.create({
          data: {
            walletAddress: address,
            username,
            displayName: username,
          },
        });
      }

      const session = await createSession(user.id, undefined, address);

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            walletAddress: user.walletAddress,
            avatar: user.avatar,
          },
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Authentication failed",
      });
    }
  });

  fastify.get("/tokens/balance", async (request: any, reply) => {
    await authenticate(request, reply);

    try {
      const { tokenAddress, chainId } = z.object({
        tokenAddress: z.string(),
        chainId: z.coerce.number(),
      }).parse(request.query);

      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user?.walletAddress) {
        return reply.code(400).send({
          success: false,
          error: "No wallet connected",
        });
      }

      const balance = await getTokenBalance(tokenAddress, user.walletAddress, chainId);

      return reply.send({
        success: true,
        data: { balance },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get token balance",
      });
    }
  });

  fastify.post("/nft/verify", async (request: any, reply) => {
    await authenticate(request, reply);

    try {
      const body = z.object({
        nftAddress: z.string(),
        chainId: z.number(),
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

      const hasNFT = await verifyNFTOwnership(
        body.nftAddress,
        user.walletAddress,
        body.chainId
      );

      return reply.send({
        success: true,
        data: { verified: hasNFT },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to verify NFT ownership",
      });
    }
  });

  fastify.get("/me/tokens", async (request: any, reply) => {
    await authenticate(request, reply);

    try {
      const tokens = await prisma.token.findMany({
        where: { userId: request.userId },
        orderBy: { createdAt: "desc" },
      });

      return reply.send({
        success: true,
        data: tokens,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get tokens",
      });
    }
  });

  fastify.post("/me/tokens", async (request: any, reply) => {
    await authenticate(request, reply);

    try {
      const body = z.object({
        address: z.string(),
        symbol: z.string(),
        name: z.string(),
        decimals: z.number(),
        balance: z.string(),
        chain: z.string(),
      }).parse(request.body);

      const token = await prisma.token.upsert({
        where: {
          userId_address_chain: {
            userId: request.userId,
            address: body.address,
            chain: body.chain,
          },
        },
        update: {
          balance: body.balance,
        },
        create: {
          ...body,
          userId: request.userId,
        },
      });

      return reply.send({
        success: true,
        data: token,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to save token",
      });
    }
  });
};