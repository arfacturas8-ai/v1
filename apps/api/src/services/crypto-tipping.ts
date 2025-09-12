import { prisma } from "@cryb/database";
import { ethers } from "ethers";

export interface TipRequest {
  senderId: string;
  recipientId: string;
  amount: string; // in wei
  currency: string;
  message?: string;
  isAnonymous?: boolean;
}

export interface TipResult {
  success: boolean;
  tipId?: string;
  txHash?: string;
  error?: string;
}

export interface RewardDistribution {
  totalAmount: string;
  recipients: Array<{
    userId: string;
    amount: string;
    reason: string;
  }>;
  currency: string;
  batchId?: string;
}

export interface UserTipStats {
  totalSent: string;
  totalReceived: string;
  tipCount: number;
  receivedCount: number;
  topCurrencies: Array<{
    currency: string;
    amount: string;
    count: number;
  }>;
}

export class CryptoTippingService {
  private readonly supportedCurrencies = ['ETH', 'USDC', 'USDT', 'MATIC'];
  private readonly minTipAmounts: Record<string, string> = {
    'ETH': '0.001', // 0.001 ETH
    'USDC': '1', // $1 USDC
    'USDT': '1', // $1 USDT
    'MATIC': '1', // 1 MATIC
  };

  /**
   * Send a crypto tip to another user
   */
  async sendTip(request: TipRequest): Promise<TipResult> {
    try {
      // Validate inputs
      const validation = this.validateTipRequest(request);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Check if sender and recipient exist and have wallets
      const [sender, recipient] = await Promise.all([
        prisma.user.findUnique({
          where: { id: request.senderId },
        }),
        prisma.user.findUnique({
          where: { id: request.recipientId },
        }),
      ]);

      if (!sender) {
        return { success: false, error: 'Sender not found' };
      }

      if (!recipient) {
        return { success: false, error: 'Recipient not found' };
      }

      if (!sender.walletAddress) {
        return { success: false, error: 'Sender wallet not connected' };
      }

      if (!recipient.walletAddress) {
        return { success: false, error: 'Recipient wallet not connected' };
      }

      // Check daily tip limits
      const dailyLimit = await this.checkDailyTipLimit(request.senderId, request.amount, request.currency);
      if (!dailyLimit.allowed) {
        return { success: false, error: dailyLimit.reason };
      }

      // Convert amount to USD for limit checking
      const usdAmount = await this.convertToUSD(request.amount, request.currency);

      // Create tip record
      const tip = await prisma.cryptoTip.create({
        data: {
          senderId: request.senderId,
          recipientId: request.recipientId,
          amount: request.amount,
          currency: request.currency,
          usdAmount: usdAmount ? usdAmount.toString() : undefined,
          message: request.message,
          isAnonymous: request.isAnonymous || false,
          status: 'PENDING',
        },
      });

      // In a real implementation, this would trigger an on-chain transaction
      // For now, we'll simulate the transaction processing
      const processingResult = await this.processOnChainTip(tip.id, sender.walletAddress, recipient.walletAddress);

      if (!processingResult.success) {
        await prisma.cryptoTip.update({
          where: { id: tip.id },
          data: {
            status: 'FAILED',
            processedAt: new Date(),
          },
        });

        return {
          success: false,
          error: processingResult.error || 'Transaction failed'
        };
      }

      // Update tip with transaction hash
      await prisma.cryptoTip.update({
        where: { id: tip.id },
        data: {
          status: 'COMPLETED',
          txHash: processingResult.txHash,
          processedAt: new Date(),
        },
      });

      // Send notifications
      await this.sendTipNotifications(tip.id);

      return {
        success: true,
        tipId: tip.id,
        txHash: processingResult.txHash,
      };
    } catch (error) {
      console.error('Error sending tip:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request
      });

      return {
        success: false,
        error: 'Failed to send tip'
      };
    }
  }

  /**
   * Get user's tip history
   */
  async getUserTips(
    userId: string,
    type: 'sent' | 'received' | 'all' = 'all',
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const where: any = {};

      switch (type) {
        case 'sent':
          where.senderId = userId;
          break;
        case 'received':
          where.recipientId = userId;
          break;
        case 'all':
          where.OR = [
            { senderId: userId },
            { recipientId: userId }
          ];
          break;
      }

      const [tips, totalCount] = await Promise.all([
        prisma.cryptoTip.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            recipient: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.cryptoTip.count({ where }),
      ]);

      // Filter anonymous tips appropriately
      const processedTips = tips.map(tip => {
        if (tip.isAnonymous && tip.recipientId === userId && tip.senderId !== userId) {
          // Hide sender info for anonymous tips when viewed by recipient
          return {
            ...tip,
            sender: {
              id: 'anonymous',
              username: 'Anonymous',
              displayName: 'Anonymous',
              avatar: null,
            },
          };
        }
        return tip;
      });

      return {
        tips: processedTips,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error('Error getting user tips:', error);
      return { tips: [], totalCount: 0, totalPages: 0 };
    }
  }

  /**
   * Get user tip statistics
   */
  async getUserTipStats(userId: string): Promise<UserTipStats> {
    try {
      const [sentStats, receivedStats] = await Promise.all([
        prisma.cryptoTip.groupBy({
          by: ['currency'],
          where: {
            senderId: userId,
            status: 'COMPLETED',
          },
          _sum: {
            amount: true,
          },
          _count: true,
        }),
        prisma.cryptoTip.groupBy({
          by: ['currency'],
          where: {
            recipientId: userId,
            status: 'COMPLETED',
          },
          _sum: {
            amount: true,
          },
          _count: true,
        }),
      ]);

      // Calculate totals (convert to USD equivalent)
      let totalSentUSD = '0';
      let totalReceivedUSD = '0';
      let tipCount = 0;
      let receivedCount = 0;

      const topCurrencies: Record<string, { amount: string; count: number }> = {};

      // Process sent stats
      for (const stat of sentStats) {
        const usdValue = await this.convertToUSD(stat._sum.amount || '0', stat.currency);
        if (usdValue) {
          totalSentUSD = ethers.formatEther(
            ethers.parseEther(totalSentUSD) + ethers.parseEther(usdValue.toString())
          );
        }
        tipCount += stat._count;

        if (!topCurrencies[stat.currency]) {
          topCurrencies[stat.currency] = { amount: '0', count: 0 };
        }
        topCurrencies[stat.currency].amount = ethers.formatEther(
          ethers.parseEther(topCurrencies[stat.currency].amount) + 
          ethers.parseUnits(stat._sum.amount || '0', 18)
        );
        topCurrencies[stat.currency].count += stat._count;
      }

      // Process received stats
      for (const stat of receivedStats) {
        const usdValue = await this.convertToUSD(stat._sum.amount || '0', stat.currency);
        if (usdValue) {
          totalReceivedUSD = ethers.formatEther(
            ethers.parseEther(totalReceivedUSD) + ethers.parseEther(usdValue.toString())
          );
        }
        receivedCount += stat._count;

        if (!topCurrencies[stat.currency]) {
          topCurrencies[stat.currency] = { amount: '0', count: 0 };
        }
        topCurrencies[stat.currency].count += stat._count;
      }

      const topCurrenciesArray = Object.entries(topCurrencies)
        .map(([currency, data]) => ({
          currency,
          amount: data.amount,
          count: data.count,
        }))
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 5);

      return {
        totalSent: totalSentUSD,
        totalReceived: totalReceivedUSD,
        tipCount,
        receivedCount,
        topCurrencies: topCurrenciesArray,
      };
    } catch (error) {
      console.error('Error getting user tip stats:', error);
      return {
        totalSent: '0',
        totalReceived: '0',
        tipCount: 0,
        receivedCount: 0,
        topCurrencies: [],
      };
    }
  }

  /**
   * Distribute rewards to multiple users
   */
  async distributeRewards(distribution: RewardDistribution): Promise<{ success: boolean; results: TipResult[]; error?: string }> {
    try {
      if (!distribution.recipients.length) {
        return { success: false, results: [], error: 'No recipients specified' };
      }

      if (distribution.recipients.length > 100) {
        return { success: false, results: [], error: 'Too many recipients (max 100)' };
      }

      const results: TipResult[] = [];
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Process rewards in parallel (but with limited concurrency)
      const BATCH_SIZE = 10;
      for (let i = 0; i < distribution.recipients.length; i += BATCH_SIZE) {
        const batch = distribution.recipients.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (recipient) => {
          try {
            // Create reward record
            const reward = await prisma.cryptoTip.create({
              data: {
                senderId: 'system', // System-generated rewards
                recipientId: recipient.userId,
                amount: recipient.amount,
                currency: distribution.currency,
                message: `Reward: ${recipient.reason}`,
                isAnonymous: false,
                status: 'COMPLETED', // Rewards are pre-approved
                processedAt: new Date(),
              },
            });

            // Send notification
            await this.sendRewardNotification(reward.id, recipient.reason);

            return {
              success: true,
              tipId: reward.id,
            };
          } catch (error) {
            console.error('Error processing reward:', error);
            return {
              success: false,
              error: `Failed to process reward for user ${recipient.userId}`,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0,
        results,
        error: successCount < totalCount ? `${totalCount - successCount} rewards failed` : undefined,
      };
    } catch (error) {
      console.error('Error distributing rewards:', error);
      return {
        success: false,
        results: [],
        error: 'Failed to distribute rewards'
      };
    }
  }

  /**
   * Get leaderboard of top tippers
   */
  async getTipLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all' = 'monthly', limit: number = 10) {
    try {
      const startDate = this.getStartDateForPeriod(period);
      
      const where: any = {
        status: 'COMPLETED',
      };

      if (startDate) {
        where.createdAt = { gte: startDate };
      }

      const leaderboard = await prisma.cryptoTip.groupBy({
        by: ['senderId'],
        where,
        _sum: {
          usdAmount: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            usdAmount: 'desc',
          },
        },
        take: limit,
      });

      // Get user details
      const userIds = leaderboard.map(entry => entry.senderId).filter(id => id !== 'system');
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      });

      const userMap = new Map(users.map(user => [user.id, user]));

      const processedLeaderboard = leaderboard
        .filter(entry => entry.senderId !== 'system') // Exclude system rewards
        .map((entry, index) => ({
          rank: index + 1,
          user: userMap.get(entry.senderId) || null,
          totalAmount: entry._sum.usdAmount || '0',
          tipCount: entry._count,
        }))
        .filter(entry => entry.user);

      return processedLeaderboard;
    } catch (error) {
      console.error('Error getting tip leaderboard:', error);
      return [];
    }
  }

  /**
   * Get tipping analytics
   */
  async getTippingAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    try {
      const startDate = this.getStartDateForPeriod(period);
      
      const where: any = {
        status: 'COMPLETED',
        senderId: { not: 'system' }, // Exclude system rewards
      };

      if (startDate) {
        where.createdAt = { gte: startDate };
      }

      const [totalStats, currencyStats, dailyStats] = await Promise.all([
        prisma.cryptoTip.aggregate({
          where,
          _sum: { usdAmount: true },
          _count: true,
          _avg: { usdAmount: true },
        }),
        prisma.cryptoTip.groupBy({
          by: ['currency'],
          where,
          _sum: { amount: true },
          _count: true,
        }),
        this.getDailyTipStats(startDate),
      ]);

      return {
        totalVolume: totalStats._sum.usdAmount || '0',
        totalTips: totalStats._count,
        averageTip: totalStats._avg.usdAmount || '0',
        currencyBreakdown: currencyStats.map(stat => ({
          currency: stat.currency,
          volume: stat._sum.amount || '0',
          count: stat._count,
        })),
        dailyStats,
      };
    } catch (error) {
      console.error('Error getting tipping analytics:', error);
      return {
        totalVolume: '0',
        totalTips: 0,
        averageTip: '0',
        currencyBreakdown: [],
        dailyStats: [],
      };
    }
  }

  /**
   * Validate tip request
   */
  private validateTipRequest(request: TipRequest): { isValid: boolean; error?: string } {
    // Check if currency is supported
    if (!this.supportedCurrencies.includes(request.currency)) {
      return { isValid: false, error: 'Unsupported currency' };
    }

    // Check minimum amount
    const minAmount = this.minTipAmounts[request.currency];
    if (minAmount && ethers.parseEther(request.amount) < ethers.parseEther(minAmount)) {
      return { isValid: false, error: `Minimum tip amount is ${minAmount} ${request.currency}` };
    }

    // Check maximum amount (safety limit)
    const maxAmount = '1000'; // $1000 or 1000 tokens max
    if (ethers.parseEther(request.amount) > ethers.parseEther(maxAmount)) {
      return { isValid: false, error: `Maximum tip amount is ${maxAmount} ${request.currency}` };
    }

    // Check if sender and recipient are different
    if (request.senderId === request.recipientId) {
      return { isValid: false, error: 'Cannot tip yourself' };
    }

    // Validate message length
    if (request.message && request.message.length > 280) {
      return { isValid: false, error: 'Message too long (max 280 characters)' };
    }

    return { isValid: true };
  }

  /**
   * Check daily tip limits
   */
  private async checkDailyTipLimit(senderId: string, amount: string, currency: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyTips = await prisma.cryptoTip.findMany({
        where: {
          senderId,
          createdAt: { gte: today },
          status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
        },
      });

      // Calculate total sent today in USD
      let totalSentToday = 0;
      for (const tip of dailyTips) {
        const usdValue = await this.convertToUSD(tip.amount, tip.currency);
        if (usdValue) {
          totalSentToday += parseFloat(usdValue.toString());
        }
      }

      const currentTipUSD = await this.convertToUSD(amount, currency);
      const newTotal = totalSentToday + (currentTipUSD ? parseFloat(currentTipUSD.toString()) : 0);

      const DAILY_LIMIT_USD = 500; // $500 daily limit
      
      if (newTotal > DAILY_LIMIT_USD) {
        return {
          allowed: false,
          reason: `Daily tip limit of $${DAILY_LIMIT_USD} exceeded. Current: $${totalSentToday.toFixed(2)}`
        };
      }

      // Check tip frequency (max 50 tips per day)
      if (dailyTips.length >= 50) {
        return {
          allowed: false,
          reason: 'Daily tip limit of 50 tips exceeded'
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking daily tip limit:', error);
      return { allowed: false, reason: 'Unable to verify daily limits' };
    }
  }

  /**
   * Convert amount to USD (simplified implementation)
   */
  private async convertToUSD(amount: string, currency: string): Promise<number | null> {
    try {
      // In production, this would use real exchange rates from APIs
      const exchangeRates: Record<string, number> = {
        'ETH': 2000, // Example: 1 ETH = $2000
        'USDC': 1, // 1 USDC = $1
        'USDT': 1, // 1 USDT = $1
        'MATIC': 0.8, // Example: 1 MATIC = $0.80
      };

      const rate = exchangeRates[currency];
      if (!rate) return null;

      const amountNum = parseFloat(ethers.formatEther(amount));
      return amountNum * rate;
    } catch (error) {
      console.error('Error converting to USD:', error);
      return null;
    }
  }

  /**
   * Process on-chain tip (simplified simulation)
   */
  private async processOnChainTip(
    tipId: string, 
    senderAddress: string, 
    recipientAddress: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // In production, this would:
      // 1. Create and sign transaction
      // 2. Submit to blockchain
      // 3. Wait for confirmation
      // 4. Return transaction hash

      // For now, simulate processing time and generate fake tx hash
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate fake transaction hash
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      return {
        success: true,
        txHash,
      };
    } catch (error) {
      console.error('Error processing on-chain tip:', error);
      return {
        success: false,
        error: 'Transaction failed'
      };
    }
  }

  /**
   * Send tip notifications
   */
  private async sendTipNotifications(tipId: string) {
    try {
      const tip = await prisma.cryptoTip.findUnique({
        where: { id: tipId },
        include: {
          sender: { select: { id: true, username: true, displayName: true } },
          recipient: { select: { id: true, username: true, displayName: true } },
        },
      });

      if (!tip) return;

      const amount = ethers.formatEther(tip.amount);
      const senderName = tip.isAnonymous ? 'Anonymous' : tip.sender.displayName;

      // Notify recipient
      await prisma.notification.create({
        data: {
          userId: tip.recipientId,
          type: 'SYSTEM',
          title: 'Crypto Tip Received!',
          content: `You received ${amount} ${tip.currency} from ${senderName}${tip.message ? `: "${tip.message}"` : ''}`,
          data: {
            tipId: tip.id,
            amount,
            currency: tip.currency,
            txHash: tip.txHash,
          },
        },
      });

      // Notify sender (confirmation)
      await prisma.notification.create({
        data: {
          userId: tip.senderId,
          type: 'SYSTEM',
          title: 'Tip Sent Successfully',
          content: `Your tip of ${amount} ${tip.currency} to ${tip.recipient.displayName} has been processed.`,
          data: {
            tipId: tip.id,
            amount,
            currency: tip.currency,
            txHash: tip.txHash,
          },
        },
      });
    } catch (error) {
      console.error('Error sending tip notifications:', error);
    }
  }

  /**
   * Send reward notification
   */
  private async sendRewardNotification(tipId: string, reason: string) {
    try {
      const tip = await prisma.cryptoTip.findUnique({
        where: { id: tipId },
      });

      if (!tip) return;

      const amount = ethers.formatEther(tip.amount);

      await prisma.notification.create({
        data: {
          userId: tip.recipientId,
          type: 'SYSTEM',
          title: 'Reward Received!',
          content: `You received ${amount} ${tip.currency} as a reward: ${reason}`,
          data: {
            tipId: tip.id,
            amount,
            currency: tip.currency,
            reason,
          },
        },
      });
    } catch (error) {
      console.error('Error sending reward notification:', error);
    }
  }

  /**
   * Get start date for period
   */
  private getStartDateForPeriod(period: 'daily' | 'weekly' | 'monthly' | 'all'): Date | null {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return today;
      
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      
      case 'monthly':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      
      case 'all':
      default:
        return null;
    }
  }

  /**
   * Get daily tip statistics
   */
  private async getDailyTipStats(startDate: Date | null) {
    try {
      const where: any = {
        status: 'COMPLETED',
        senderId: { not: 'system' },
      };

      if (startDate) {
        where.createdAt = { gte: startDate };
      }

      // This would be more complex in production with proper time bucketing
      return [];
    } catch (error) {
      console.error('Error getting daily tip stats:', error);
      return [];
    }
  }
}

export const cryptoTippingService = new CryptoTippingService();