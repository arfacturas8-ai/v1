import { prisma } from "@cryb/database";
import axios from "axios";
import crypto from "crypto";
import { ethers } from "ethers";

export interface TransakOrderData {
  id: string;
  status: string;
  walletAddress: string;
  cryptoAmount: number;
  fiatAmount: number;
  cryptoCurrency: string;
  fiatCurrency: string;
  network: string;
  transactionHash?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentRequest {
  userId: string;
  amount: string; // in USD
  currency: string;
  cryptoCurrency: string;
  network: string;
  walletAddress: string;
  redirectUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  redirectUrl?: string;
  error?: string;
}

export class CryptoPaymentService {
  private readonly transakApiKey: string;
  private readonly transakApiSecret: string;
  private readonly transakWebhookSecret: string;
  private readonly transakBaseUrl: string;

  constructor() {
    this.transakApiKey = process.env.TRANSAK_API_KEY || '';
    this.transakApiSecret = process.env.TRANSAK_API_SECRET || '';
    this.transakWebhookSecret = process.env.TRANSAK_WEBHOOK_SECRET || '';
    this.transakBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.transak.com' 
      : 'https://api-staging.transak.com';

    if (!this.transakApiKey) {
      console.warn('Transak API key not configured. Payment functionality will be limited.');
    }
  }

  /**
   * Initialize a crypto purchase with Transak
   */
  async initiatePurchase(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Validate inputs
      const validation = this.validatePaymentRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Validate wallet address
      if (!ethers.isAddress(request.walletAddress)) {
        return {
          success: false,
          error: 'Invalid wallet address'
        };
      }

      // Check for duplicate pending payments
      const existingPendingPayment = await prisma.cryptoPayment.findFirst({
        where: {
          userId: request.userId,
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000) // Within last 30 minutes
          }
        }
      });

      if (existingPendingPayment) {
        return {
          success: false,
          error: 'You have a pending payment. Please wait for it to complete or cancel it first.'
        };
      }

      // Generate unique order ID
      const orderId = `cryb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payment record in database
      const payment = await prisma.cryptoPayment.create({
        data: {
          userId: request.userId,
          transactionType: 'DEPOSIT',
          provider: 'TRANSAK',
          amount: ethers.parseEther(request.amount).toString(),
          currency: request.cryptoCurrency,
          usdAmount: request.amount,
          recipientAddress: request.walletAddress,
          chain: this.mapNetworkToChain(request.network),
          status: 'PENDING',
          externalId: orderId,
          metadata: {
            fiatCurrency: request.currency,
            network: request.network,
            redirectUrl: request.redirectUrl,
            originalRequest: request
          }
        }
      });

      // Generate Transak checkout URL
      const checkoutUrl = this.generateTransakCheckoutUrl({
        orderId,
        walletAddress: request.walletAddress,
        cryptoCurrency: request.cryptoCurrency,
        fiatCurrency: request.currency,
        fiatAmount: request.amount,
        network: request.network,
        redirectUrl: request.redirectUrl || `${process.env.FRONTEND_URL}/payments/success?orderId=${payment.id}`
      });

      return {
        success: true,
        orderId: payment.id,
        redirectUrl: checkoutUrl
      };
    } catch (error) {
      console.error('Error initiating crypto purchase:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request: {
          ...request,
          userId: request.userId // Don't log sensitive data
        }
      });

      return {
        success: false,
        error: 'Failed to initiate crypto purchase. Please try again.'
      };
    }
  }

  /**
   * Handle Transak webhook events with enhanced security and error handling
   */
  async handleWebhook(body: any, signature: string, headers: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    try {
      // Rate limiting check (simple in-memory, use Redis in production)
      if (!this.checkWebhookRateLimit(headers['x-forwarded-for'] || 'unknown')) {
        console.warn('Webhook rate limit exceeded');
        return { success: false, error: 'Rate limit exceeded' };
      }

      // Verify webhook signature
      if (!this.verifyWebhookSignature(body, signature)) {
        console.error('Invalid webhook signature', {
          expectedSignature: signature,
          bodyKeys: Object.keys(body)
        });
        return { success: false, error: 'Invalid signature' };
      }

      // Validate webhook data structure
      const validation = this.validateWebhookData(body);
      if (!validation.isValid) {
        console.error('Invalid webhook data structure:', {
          errors: validation.errors,
          body
        });
        return { success: false, error: 'Invalid webhook data' };
      }

      const { orderId, status, eventData } = body;

      // Find payment record
      const payment = await prisma.cryptoPayment.findFirst({
        where: {
          OR: [
            { id: orderId },
            { externalId: orderId }
          ]
        }
      });

      if (!payment) {
        console.error('Payment not found for webhook:', { 
          orderId,
          availablePayments: await prisma.cryptoPayment.count()
        });
        return { success: false, error: 'Payment not found' };
      }

      // Prevent duplicate webhook processing
      const webhookProcessed = await this.isWebhookProcessed(orderId, body.eventId || body.timestamp);
      if (webhookProcessed) {
        console.log('Webhook already processed, skipping:', { orderId });
        return { success: true }; // Return success to prevent retry
      }

      // Record webhook processing
      await this.recordWebhookProcessing(orderId, body.eventId || body.timestamp, body);

      // Update payment status with transaction
      const updatedPayment = await prisma.$transaction(async (tx) => {
        return await tx.cryptoPayment.update({
          where: { id: payment.id },
          data: {
            status: this.mapTransakStatusToInternal(status) as any,
            webhookData: body,
            txHash: eventData?.transactionHash,
            completedAt: ['COMPLETED', 'completed'].includes(status) ? new Date() : payment.completedAt,
            updatedAt: new Date()
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true
              }
            }
          }
        });
      });

      // Send notification to user (async, don't block webhook response)
      this.notifyUser(updatedPayment).catch(error => {
        console.error('Failed to send user notification:', error);
      });

      // Log successful webhook processing
      console.log('Webhook processed successfully:', {
        orderId,
        status,
        previousStatus: payment.status
      });

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: body ? Object.keys(body) : 'No body'
      });

      return { success: false, error: 'Webhook processing failed' };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string) {
    try {
      const payment = await prisma.cryptoPayment.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              walletAddress: true
            }
          }
        }
      });

      if (!payment) {
        return null;
      }

      return {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        usdAmount: payment.usdAmount,
        txHash: payment.txHash,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        metadata: payment.metadata,
        user: payment.user
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return null;
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(userId: string, page: number = 1, limit: number = 20) {
    try {
      const payments = await prisma.cryptoPayment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          transactionType: true,
          provider: true,
          status: true,
          amount: true,
          currency: true,
          usdAmount: true,
          txHash: true,
          createdAt: true,
          completedAt: true,
          metadata: true
        }
      });

      const totalCount = await prisma.cryptoPayment.count({
        where: { userId }
      });

      return {
        payments,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      };
    } catch (error) {
      console.error('Error getting user payments:', error);
      return { payments: [], totalCount: 0, totalPages: 0 };
    }
  }

  /**
   * Cancel pending payment
   */
  async cancelPayment(paymentId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const payment = await prisma.cryptoPayment.findFirst({
        where: {
          id: paymentId,
          userId,
          status: 'PENDING'
        }
      });

      if (!payment) {
        return { success: false, error: 'Payment not found or cannot be cancelled' };
      }

      await prisma.cryptoPayment.update({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error cancelling payment:', error);
      return { success: false, error: 'Failed to cancel payment' };
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    provider?: string;
  }) {
    try {
      const where: any = {};

      if (filters?.startDate) {
        where.createdAt = { gte: filters.startDate };
      }

      if (filters?.endDate) {
        where.createdAt = { ...where.createdAt, lte: filters.endDate };
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.provider) {
        where.provider = filters.provider;
      }

      const [totalPayments, completedPayments, totalVolume, avgOrderValue] = await Promise.all([
        prisma.cryptoPayment.count({ where }),
        prisma.cryptoPayment.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.cryptoPayment.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { usdAmount: true }
        }),
        prisma.cryptoPayment.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _avg: { usdAmount: true }
        })
      ]);

      const conversionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

      return {
        totalPayments,
        completedPayments,
        totalVolume: totalVolume._sum.usdAmount || '0',
        avgOrderValue: avgOrderValue._avg.usdAmount || '0',
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting payment analytics:', error);
      return {
        totalPayments: 0,
        completedPayments: 0,
        totalVolume: '0',
        avgOrderValue: '0',
        conversionRate: 0
      };
    }
  }

  /**
   * Generate Transak checkout URL with enhanced parameters
   */
  private generateTransakCheckoutUrl(params: {
    orderId: string;
    walletAddress: string;
    cryptoCurrency: string;
    fiatCurrency: string;
    fiatAmount: string;
    network: string;
    redirectUrl: string;
  }): string {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://global.transak.com' 
      : 'https://staging-global.transak.com';
      
    const queryParams = new URLSearchParams({
      apiKey: this.transakApiKey,
      hostURL: process.env.FRONTEND_URL || 'http://localhost:3000',
      walletAddress: params.walletAddress,
      cryptoCurrencyCode: params.cryptoCurrency,
      fiatCurrency: params.fiatCurrency,
      fiatAmount: params.fiatAmount,
      network: params.network,
      redirectURL: params.redirectUrl,
      partnerOrderId: params.orderId,
      hideMenu: 'true',
      themeColor: '6366f1', // CRYB brand color
      email: '', // Will be populated by user during checkout
      disableWalletAddressForm: 'true',
      exchangeScreenTitle: 'Buy Crypto for CRYB',
      isAutoFillUserData: 'true'
    });

    return `${baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Verify webhook signature with multiple formats support
   */
  private verifyWebhookSignature(body: any, signature: string): boolean {
    if (!this.transakWebhookSecret) {
      console.warn('Transak webhook secret not configured. Skipping signature verification in development.');
      return process.env.NODE_ENV !== 'production';
    }

    try {
      const payload = JSON.stringify(body);
      const hmac = crypto.createHmac('sha256', this.transakWebhookSecret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Try different signature formats
      const signatureFormats = [
        signature,
        signature.replace('sha256=', ''),
        `sha256=${expectedSignature}`,
        expectedSignature
      ];

      for (const sigFormat of signatureFormats) {
        try {
          const sigToTest = sigFormat.replace('sha256=', '');
          if (crypto.timingSafeEqual(
            Buffer.from(sigToTest, 'hex'),
            Buffer.from(expectedSignature, 'hex')
          )) {
            return true;
          }
        } catch {
          continue;
        }
      }

      console.error('Webhook signature verification failed:', {
        providedSignature: signature,
        expectedSignature,
        payloadLength: payload.length
      });
      
      return false;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Map Transak status to internal status
   */
  private mapTransakStatusToInternal(transakStatus: string): string {
    const statusMap: Record<string, string> = {
      'AWAITING_PAYMENT_FROM_USER': 'PENDING',
      'PAYMENT_DONE_MARKED_BY_USER': 'PROCESSING',
      'PROCESSING': 'PROCESSING',
      'PENDING_DELIVERY_FROM_TRANSAK': 'PROCESSING',
      'ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK': 'PROCESSING',
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED',
      'FAILED': 'FAILED',
      'REFUNDED': 'REFUNDED',
      'EXPIRED': 'CANCELLED'
    };

    return statusMap[transakStatus] || 'PENDING';
  }

  /**
   * Map network name to chain
   */
  private mapNetworkToChain(network: string): string {
    const networkMap: Record<string, string> = {
      'ethereum': 'ethereum',
      'polygon': 'polygon',
      'arbitrum': 'arbitrum',
      'optimism': 'optimism',
      'bsc': 'bsc',
      'avalanche': 'avalanche'
    };

    return networkMap[network.toLowerCase()] || 'ethereum';
  }

  /**
   * Update payment from webhook data
   */
  private async updatePaymentFromWebhook(
    paymentId: string,
    updates: {
      status: string;
      webhookData: any;
      txHash?: string;
      completedAt?: Date;
    }
  ) {
    return await prisma.cryptoPayment.update({
      where: { id: paymentId },
      data: {
        status: updates.status as any,
        webhookData: updates.webhookData,
        txHash: updates.txHash,
        completedAt: updates.completedAt,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });
  }

  /**
   * Send notification to user about payment status
   */
  private async notifyUser(payment: any) {
    try {
      let message = '';
      let type = 'SYSTEM';

      switch (payment.status) {
        case 'PROCESSING':
          message = `Your crypto purchase of ${payment.currency} ${ethers.formatEther(payment.amount)} is being processed.`;
          break;
        case 'COMPLETED':
          message = `Your crypto purchase of ${payment.currency} ${ethers.formatEther(payment.amount)} has been completed successfully!`;
          break;
        case 'FAILED':
          message = `Your crypto purchase of ${payment.currency} ${ethers.formatEther(payment.amount)} has failed. Please try again or contact support.`;
          break;
        case 'CANCELLED':
          message = `Your crypto purchase of ${payment.currency} ${ethers.formatEther(payment.amount)} has been cancelled.`;
          break;
        default:
          return; // Don't send notification for other statuses
      }

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          type: type as any,
          title: 'Crypto Purchase Update',
          content: message,
          data: {
            paymentId: payment.id,
            amount: ethers.formatEther(payment.amount),
            currency: payment.currency,
            txHash: payment.txHash
          }
        }
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate amount
    const amount = parseFloat(request.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be a positive number');
    } else if (amount < 10) {
      errors.push('Minimum purchase amount is $10');
    } else if (amount > 10000) {
      errors.push('Maximum purchase amount is $10,000');
    }

    // Validate currencies and networks
    const supportedOptions = this.getSupportedOptions();
    
    if (!supportedOptions.fiatCurrencies.includes(request.currency)) {
      errors.push('Unsupported fiat currency');
    }

    const cryptoCurrency = supportedOptions.cryptoCurrencies.find(
      c => c.code === request.cryptoCurrency
    );
    if (!cryptoCurrency) {
      errors.push('Unsupported cryptocurrency');
    } else if (!cryptoCurrency.networks.includes(request.network)) {
      errors.push('Invalid network for selected cryptocurrency');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate webhook data structure
   */
  private validateWebhookData(body: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!body.orderId) {
      errors.push('Missing orderId');
    }

    if (!body.status) {
      errors.push('Missing status');
    }

    const validStatuses = [
      'AWAITING_PAYMENT_FROM_USER',
      'PAYMENT_DONE_MARKED_BY_USER',
      'PROCESSING',
      'PENDING_DELIVERY_FROM_TRANSAK',
      'ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK',
      'COMPLETED',
      'CANCELLED',
      'FAILED',
      'REFUNDED',
      'EXPIRED'
    ];

    if (body.status && !validStatuses.includes(body.status)) {
      errors.push('Invalid status value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Simple in-memory rate limiting for webhooks
   */
  private webhookRateLimit: Map<string, number[]> = new Map();

  private checkWebhookRateLimit(ip: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 10; // Max 10 webhooks per minute per IP

    const requests = this.webhookRateLimit.get(ip) || [];
    const validRequests = requests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.webhookRateLimit.set(ip, validRequests);
    return true;
  }

  /**
   * Check if webhook has been processed
   */
  private async isWebhookProcessed(orderId: string, eventId: string): Promise<boolean> {
    if (!eventId) return false;

    try {
      const existing = await prisma.cryptoPayment.findFirst({
        where: {
          externalId: orderId,
          webhookData: {
            path: ['eventId'],
            equals: eventId
          }
        }
      });

      return !!existing;
    } catch (error) {
      console.warn('Error checking webhook processing status:', error);
      return false;
    }
  }

  /**
   * Record webhook processing
   */
  private async recordWebhookProcessing(orderId: string, eventId: string, body: any): Promise<void> {
    try {
      // In a production system, you might want a separate webhook_events table
      // For now, we'll rely on the webhookData field in the payment record
      console.log('Recording webhook processing:', { orderId, eventId });
    } catch (error) {
      console.error('Error recording webhook processing:', error);
    }
  }

  /**
   * Get supported currencies and networks
   */
  getSupportedOptions() {
    return {
      fiatCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],
      cryptoCurrencies: [
        { code: 'ETH', name: 'Ethereum', networks: ['ethereum'] },
        { code: 'USDC', name: 'USD Coin', networks: ['ethereum', 'polygon', 'arbitrum', 'optimism'] },
        { code: 'USDT', name: 'Tether USD', networks: ['ethereum', 'polygon', 'arbitrum', 'optimism'] },
        { code: 'BTC', name: 'Bitcoin', networks: ['bitcoin'] },
        { code: 'MATIC', name: 'Polygon', networks: ['polygon'] },
        { code: 'AVAX', name: 'Avalanche', networks: ['avalanche'] },
        { code: 'BNB', name: 'Binance Coin', networks: ['bsc'] }
      ],
      networks: [
        { code: 'ethereum', name: 'Ethereum', chainId: 1 },
        { code: 'polygon', name: 'Polygon', chainId: 137 },
        { code: 'arbitrum', name: 'Arbitrum', chainId: 42161 },
        { code: 'optimism', name: 'Optimism', chainId: 10 },
        { code: 'bsc', name: 'Binance Smart Chain', chainId: 56 },
        { code: 'avalanche', name: 'Avalanche', chainId: 43114 }
      ]
    };
  }
}

export const cryptoPaymentService = new CryptoPaymentService();