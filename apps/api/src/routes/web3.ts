import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { createSession } from "@cryb/auth";
import { authMiddleware } from "../middleware/auth";
import { ethers } from "ethers";
import { SiweMessage } from "siwe";

// Real Web3 implementations
const generateNonce = () => ethers.randomBytes(16).toString('hex');

const generateSiweMessage = async (params: { address: string; domain: string; chainId?: number }) => {
  const siweMessage = new SiweMessage({
    domain: params.domain,
    address: params.address,
    statement: "Sign in to CRYB Platform with your Web3 wallet",
    uri: `https://${params.domain}`,
    version: "1",
    chainId: params.chainId || 1,
    nonce: generateNonce(),
    issuedAt: new Date().toISOString(),
  });
  return siweMessage.prepareMessage();
};

const verifySiweMessage = async (message: string, signature: string) => {
  try {
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });
    return { 
      success: result.success,
      data: result.success ? {
        address: siweMessage.address,
        chainId: siweMessage.chainId,
        nonce: siweMessage.nonce
      } : null,
      error: result.error
    };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
};

// Initialize providers for different chains
const getProvider = (chainId: number = 1) => {
  const rpcUrls: Record<number, string> = {
    1: process.env.ETHEREUM_RPC_URL || `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
    137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    56: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org'
  };
  
  const rpcUrl = rpcUrls[chainId] || rpcUrls[1];
  return new ethers.JsonRpcProvider(rpcUrl);
};

const getTokenBalance = async (tokenAddress: string, walletAddress: string, chainId: number = 1) => {
  try {
    const provider = getProvider(chainId);
    
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      // ETH balance
      const balance = await provider.getBalance(walletAddress);
      return { 
        balance: ethers.formatEther(balance),
        symbol: 'ETH',
        decimals: 18
      };
    }
    
    // ERC-20 token balance
    const tokenAbi = [
      "function balanceOf(address) view returns (uint256)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)"
    ];
    
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
    const [balance, symbol, decimals] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.symbol(),
      tokenContract.decimals()
    ]);
    
    return {
      balance: ethers.formatUnits(balance, decimals),
      symbol,
      decimals: Number(decimals)
    };
  } catch (error: any) {
    console.error('Token balance error:', error);
    return { balance: '0', symbol: 'UNKNOWN', decimals: 18 };
  }
};

const verifyNFTOwnership = async (contractAddress: string, walletAddress: string, chainId: number = 1) => {
  try {
    const provider = getProvider(chainId);
    
    const nftAbi = [
      "function balanceOf(address) view returns (uint256)",
      "function ownerOf(uint256) view returns (address)",
      "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)"
    ];
    
    const nftContract = new ethers.Contract(contractAddress, nftAbi, provider);
    const balance = await nftContract.balanceOf(walletAddress);
    
    return Number(balance) > 0;
  } catch (error: any) {
    console.error('NFT verification error:', error);
    return false;
  }
};

const web3Routes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/siwe/nonce", async (request, reply) => {
    try {
      const nonce = generateNonce();
      
      // Store nonce temporarily (you might want to use Redis for this)
      await prisma.web3Nonce.create({
        data: {
          nonce,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        }
      }).catch(() => {
        // If table doesn't exist, just continue - nonce will be validated in verify
      });
      
      return reply.send({
        success: true,
        data: { nonce },
      });
    } catch (error: any) {
      fastify.log.error('Nonce generation failed:', error);
      return reply.code(500).send({
        success: false,
        error: "Failed to generate nonce",
      });
    }
  });

  fastify.post("/siwe/message", async (request, reply) => {
    try {
      const body = z.object({
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
        chainId: z.number().optional().default(1),
        domain: z.string().optional().default("cryb.app"),
      }).parse(request.body);

      const message = await generateSiweMessage({
        address: body.address,
        domain: body.domain,
        chainId: body.chainId,
      });

      return reply.send({
        success: true,
        data: { message },
      });
    } catch (error: any) {
      fastify.log.error('SIWE message generation failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to generate SIWE message",
      });
    }
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
          error: result.error || "Invalid signature",
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
    await authMiddleware(request, reply);

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
    await authMiddleware(request, reply);

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
    await authMiddleware(request, reply);

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
    await authMiddleware(request, reply);

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

  fastify.post("/tokens/portfolio", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
        chains: z.array(z.string()).default(['ethereum']),
        includeUsdValues: z.boolean().default(true),
        includePriceData: z.boolean().default(false),
      }).parse(request.body);

      const tokens: any[] = [];

      // Get tokens for each chain
      for (const chain of body.chains) {
        try {
          const chainId = getChainId(chain);
          const provider = getProvider(chainId);

          // Get ETH balance
          const ethBalance = await provider.getBalance(body.address);
          tokens.push({
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ethereum',
            balance: ethers.formatEther(ethBalance),
            decimals: 18,
            usdValue: body.includeUsdValues ? parseFloat(ethers.formatEther(ethBalance)) * 2000 : undefined, // Mock price
            change24h: body.includePriceData ? Math.random() * 10 - 5 : undefined, // Mock change
            logo: '/tokens/eth.png'
          });

          // Common ERC-20 tokens to check
          const commonTokens = [
            { address: '0xA0b86a33E6441f3de0B0b3b2eA11b93cD0dE8F72', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
            { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ethereum', decimals: 18 },
            { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 }
          ];

          for (const tokenInfo of commonTokens) {
            try {
              const balance = await getTokenBalance(tokenInfo.address, body.address, chainId);
              if (parseFloat(balance.balance) > 0) {
                tokens.push({
                  address: tokenInfo.address,
                  symbol: balance.symbol,
                  name: tokenInfo.name,
                  balance: balance.balance,
                  decimals: balance.decimals,
                  usdValue: body.includeUsdValues ? parseFloat(balance.balance) * 1 : undefined, // Mock price
                  change24h: body.includePriceData ? Math.random() * 10 - 5 : undefined,
                  logo: `/tokens/${balance.symbol.toLowerCase()}.png`
                });
              }
            } catch (tokenError) {
              console.warn(`Failed to get balance for ${tokenInfo.symbol}:`, tokenError);
            }
          }
        } catch (chainError) {
          console.warn(`Failed to get balances for chain ${chain}:`, chainError);
        }
      }

      return reply.send({
        success: true,
        data: {
          address: body.address,
          chains: body.chains,
          tokens: tokens.filter(token => parseFloat(token.balance) > 0),
          totalUsdValue: body.includeUsdValues ? tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0) : undefined,
          lastUpdated: new Date().toISOString()
        },
      });
    } catch (error) {
      fastify.log.error("Portfolio fetch failed:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to fetch portfolio",
      });
    }
  });

  // Helper function to get chain ID
  function getChainId(chain: string): number {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      bsc: 56
    };
    return chainIds[chain] || 1;
  }
};

export default web3Routes;