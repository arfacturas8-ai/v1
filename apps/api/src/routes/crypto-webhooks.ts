import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { cryptoPaymentService } from "../services/crypto-payments";

const cryptoWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  // Transak webhook handler
  fastify.post("/transak", async (request: any, reply) => {
    try {
      const signature = request.headers['x-signature'] || request.headers['signature'] || '';
      const body = request.body;

      // Log webhook reception for debugging
      fastify.log.info('Received Transak webhook:', {
        signature: signature ? 'present' : 'missing',
        orderId: body?.orderId,
        status: body?.status,
        timestamp: new Date().toISOString()
      });

      // Handle the webhook
      const result = await cryptoPaymentService.handleWebhook(body, signature, request.headers);

      if (!result.success) {
        fastify.log.error('Webhook processing failed:', {
          error: result.error,
          orderId: body?.orderId,
          status: body?.status
        });
        
        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }

      // Return success response to Transak
      return reply.send({
        success: true,
        message: "Webhook processed successfully"
      });
    } catch (error) {
      fastify.log.error("Critical error in Transak webhook handler:", error);

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  });

  // Webhook health check for Transak
  fastify.get("/transak/health", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Webhook endpoint is healthy",
      timestamp: new Date().toISOString()
    });
  });

  // MoonPay webhook handler (for future use)
  fastify.post("/moonpay", async (request: any, reply) => {
    try {
      const signature = request.headers['moonpay-signature'] || '';
      const body = request.body;

      fastify.log.info('Received MoonPay webhook (not yet implemented):', {
        signature: signature ? 'present' : 'missing',
        transactionId: body?.transactionId,
        status: body?.status
      });

      // TODO: Implement MoonPay webhook handling
      return reply.send({
        success: true,
        message: "MoonPay webhook received (processing not yet implemented)"
      });
    } catch (error) {
      fastify.log.error("Error in MoonPay webhook handler:", error);

      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  });

  // Generic webhook test endpoint (development only)
  if (process.env.NODE_ENV !== 'production') {
    fastify.post("/test", async (request: any, reply) => {
      const body = request.body;
      const headers = request.headers;

      fastify.log.info('Test webhook received:', {
        body,
        headers: {
          'content-type': headers['content-type'],
          'user-agent': headers['user-agent'],
          'signature': headers['signature'] || headers['x-signature']
        }
      });

      return reply.send({
        success: true,
        message: "Test webhook received",
        receivedData: {
          body,
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  // Webhook status endpoint (admin only)
  fastify.get("/status", async (request: any, reply) => {
    try {
      // Simple status check - you might want to add authentication here
      const recentWebhooksCount = await fastify.prisma.cryptoPayment.count({
        where: {
          webhookData: {
            not: null
          },
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      const pendingPaymentsCount = await fastify.prisma.cryptoPayment.count({
        where: {
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      return reply.send({
        success: true,
        data: {
          recentWebhooksProcessed: recentWebhooksCount,
          pendingPaymentsLast24h: pendingPaymentsCount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      fastify.log.error("Error getting webhook status:", error);

      return reply.code(500).send({
        success: false,
        error: "Failed to get webhook status",
      });
    }
  });
};

export default cryptoWebhookRoutes;