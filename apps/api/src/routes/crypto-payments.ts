import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { cryptoPaymentService } from "../services/crypto-payments";
import { prisma } from "@cryb/database";

const cryptoPaymentRoutes: FastifyPluginAsync = async (fastify) => {
  // Initiate crypto purchase
  fastify.post("/purchase", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        amount: z.string().refine((val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0 && num <= 10000; // Max $10,000 per transaction
        }, "Amount must be a valid number between 0 and 10,000"),
        currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']),
        cryptoCurrency: z.enum(['ETH', 'USDC', 'USDT', 'BTC', 'MATIC', 'AVAX', 'BNB']),
        network: z.enum(['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'avalanche', 'bitcoin']),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
        redirectUrl: z.string().url().optional(),
      }).parse(request.body);

      // Verify user owns the wallet address
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user?.walletAddress) {
        return reply.code(400).send({
          success: false,
          error: "No wallet connected",
        });
      }

      if (user.walletAddress.toLowerCase() !== body.walletAddress.toLowerCase()) {
        return reply.code(400).send({
          success: false,
          error: "Wallet address does not match user's connected wallet",
        });
      }

      const result = await cryptoPaymentService.initiatePurchase({
        userId: request.userId,
        amount: body.amount,
        currency: body.currency,
        cryptoCurrency: body.cryptoCurrency,
        network: body.network,
        walletAddress: body.walletAddress,
        redirectUrl: body.redirectUrl,
      });

      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }

      return reply.send({
        success: true,
        data: {
          orderId: result.orderId,
          redirectUrl: result.redirectUrl,
          message: "Crypto purchase initiated successfully",
        },
      });
    } catch (error) {
      fastify.log.error("Failed to initiate crypto purchase:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to initiate crypto purchase",
      });
    }
  });

  // Get payment status
  fastify.get("/payments/:paymentId", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const params = z.object({
        paymentId: z.string(),
      }).parse(request.params);

      const payment = await cryptoPaymentService.getPaymentStatus(params.paymentId);

      if (!payment) {
        return reply.code(404).send({
          success: false,
          error: "Payment not found",
        });
      }

      // Verify user owns this payment
      if (payment.user.id !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Not authorized to view this payment",
        });
      }

      return reply.send({
        success: true,
        data: payment,
      });
    } catch (error) {
      fastify.log.error("Failed to get payment status:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid payment ID",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get payment status",
      });
    }
  });

  // Get user's payment history
  fastify.get("/payments", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const query = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      }).parse(request.query);

      const result = await cryptoPaymentService.getUserPayments(
        request.userId,
        query.page,
        query.limit
      );

      return reply.send({
        success: true,
        data: {
          payments: result.payments,
          pagination: {
            page: query.page,
            limit: query.limit,
            totalCount: result.totalCount,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      fastify.log.error("Failed to get payment history:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get payment history",
      });
    }
  });

  // Cancel pending payment
  fastify.post("/payments/:paymentId/cancel", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const params = z.object({
        paymentId: z.string(),
      }).parse(request.params);

      const result = await cryptoPaymentService.cancelPayment(
        params.paymentId,
        request.userId
      );

      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }

      return reply.send({
        success: true,
        data: {
          message: "Payment cancelled successfully",
        },
      });
    } catch (error) {
      fastify.log.error("Failed to cancel payment:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid payment ID",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to cancel payment",
      });
    }
  });

  // Get supported payment options
  fastify.get("/supported-options", async (request, reply) => {
    try {
      const options = cryptoPaymentService.getSupportedOptions();

      return reply.send({
        success: true,
        data: options,
      });
    } catch (error) {
      fastify.log.error("Failed to get supported options:", error);

      return reply.code(500).send({
        success: false,
        error: "Failed to get supported options",
      });
    }
  });

  // Get payment analytics (admin only)
  fastify.get("/analytics", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user || !user.isSystem) {
        return reply.code(403).send({
          success: false,
          error: "Not authorized to view analytics",
        });
      }

      const query = z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
        provider: z.enum(['TRANSAK', 'MOONPAY', 'RAMP', 'MANUAL', 'ONCHAIN']).optional(),
      }).parse(request.query);

      const filters: any = {};
      if (query.startDate) filters.startDate = new Date(query.startDate);
      if (query.endDate) filters.endDate = new Date(query.endDate);
      if (query.status) filters.status = query.status;
      if (query.provider) filters.provider = query.provider;

      const analytics = await cryptoPaymentService.getPaymentAnalytics(filters);

      return reply.send({
        success: true,
        data: analytics,
      });
    } catch (error) {
      fastify.log.error("Failed to get payment analytics:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get payment analytics",
      });
    }
  });

  // Get payment by external ID (for webhook purposes)
  fastify.get("/external/:externalId", async (request: any, reply) => {
    try {
      const params = z.object({
        externalId: z.string(),
      }).parse(request.params);

      // This endpoint is typically used internally by webhooks
      // Add IP whitelist or other security measures in production
      const payment = await prisma.cryptoPayment.findFirst({
        where: {
          externalId: params.externalId,
        },
        select: {
          id: true,
          status: true,
          externalId: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!payment) {
        return reply.code(404).send({
          success: false,
          error: "Payment not found",
        });
      }

      return reply.send({
        success: true,
        data: payment,
      });
    } catch (error) {
      fastify.log.error("Failed to get payment by external ID:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid external ID",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get payment",
      });
    }
  });

  // Validate payment request
  fastify.post("/validate", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        amount: z.string(),
        currency: z.string(),
        cryptoCurrency: z.string(),
        network: z.string(),
        walletAddress: z.string(),
      }).parse(request.body);

      const errors: string[] = [];

      // Validate amount
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
      } else if (amount < 10) {
        errors.push('Minimum purchase amount is $10');
      } else if (amount > 10000) {
        errors.push('Maximum purchase amount is $10,000');
      }

      // Validate currency combinations
      const supportedOptions = cryptoPaymentService.getSupportedOptions();
      
      if (!supportedOptions.fiatCurrencies.includes(body.currency)) {
        errors.push('Unsupported fiat currency');
      }

      const cryptoCurrency = supportedOptions.cryptoCurrencies.find(
        c => c.code === body.cryptoCurrency
      );
      if (!cryptoCurrency) {
        errors.push('Unsupported cryptocurrency');
      } else if (!cryptoCurrency.networks.includes(body.network)) {
        errors.push('Invalid network for selected cryptocurrency');
      }

      // Validate wallet address format
      if (!body.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        errors.push('Invalid wallet address format');
      }

      const isValid = errors.length === 0;

      return reply.send({
        success: true,
        data: {
          valid: isValid,
          errors: errors.length > 0 ? errors : undefined,
          estimatedFees: isValid ? {
            processingFee: Math.round(amount * 0.025 * 100) / 100, // 2.5%
            networkFee: body.network === 'ethereum' ? '5-15' : '1-3',
          } : undefined,
        },
      });
    } catch (error) {
      fastify.log.error("Failed to validate payment request:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to validate payment request",
      });
    }
  });
};

export default cryptoPaymentRoutes;