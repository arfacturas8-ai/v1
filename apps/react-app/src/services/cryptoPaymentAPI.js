/**
 * Crypto Payment Backend API Integration
 * Connects crypto payment frontend to backend API for persistence and verification
 */

import api from './api';

class CryptoPaymentAPI {
  /**
   * Record a crypto payment transaction in backend
   * @param {Object} transaction - Transaction details
   */
  async recordTransaction(transaction) {
    try {
      const response = await api.post('/crypto-payments/transactions', {
        transactionHash: transaction.txHash || transaction.id,
        paymentType: transaction.type,
        fromAddress: transaction.from,
        toAddress: transaction.to,
        amount: transaction.amount.toString(),
        token: transaction.token || transaction.crypto,
        chainId: transaction.chainId,
        status: transaction.status || 'pending',
        metadata: {
          ...transaction.metadata,
          gateway: transaction.gateway,
          currency: transaction.currency
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to record transaction:', error);
      throw error;
    }
  }

  /**
   * Get user's transaction history from backend
   * @param {Number} limit - Number of transactions to fetch
   */
  async getTransactionHistory(limit = 50) {
    try {
      const response = await api.get(`/crypto-payments/transactions?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return { success: false, data: { items: [] } };
    }
  }

  /**
   * Update transaction status (e.g., pending -> confirmed)
   * @param {String} txHash - Transaction hash
   * @param {String} status - New status
   */
  async updateTransactionStatus(txHash, status) {
    try {
      const response = await api.patch(`/crypto-payments/transactions/${txHash}`, {
        status
      });
      return response;
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      throw error;
    }
  }

  /**
   * Purchase subscription with crypto
   * @param {String} tierId - Subscription tier ID
   * @param {String} token - Payment token (ETH, USDC, etc.)
   * @param {String} txHash - Transaction hash from blockchain
   */
  async purchaseSubscription(tierId, token, txHash, billingPeriod = 'monthly') {
    try {
      const response = await api.post('/crypto-payments/subscriptions', {
        tierId,
        paymentToken: token,
        transactionHash: txHash,
        billingPeriod
      });
      return response;
    } catch (error) {
      console.error('Failed to purchase subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's active subscriptions
   */
  async getSubscriptions() {
    try {
      const response = await api.get('/crypto-payments/subscriptions');
      return response;
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      return { success: false, data: { subscriptions: [] } };
    }
  }

  /**
   * Cancel a subscription
   * @param {String} subscriptionId - Subscription ID
   */
  async cancelSubscription(subscriptionId) {
    try {
      const response = await api.post(`/crypto-payments/subscriptions/${subscriptionId}/cancel`);
      return response;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Send crypto tip to creator/user
   * @param {String} recipientId - User ID of recipient
   * @param {String} amount - Tip amount
   * @param {String} token - Token type
   * @param {String} txHash - Transaction hash
   */
  async sendTip(recipientId, amount, token, txHash) {
    try {
      const response = await api.post('/crypto-payments/tips', {
        recipientId,
        amount: amount.toString(),
        token,
        transactionHash: txHash
      });
      return response;
    } catch (error) {
      console.error('Failed to send tip:', error);
      throw error;
    }
  }

  /**
   * Get received tips
   */
  async getReceivedTips() {
    try {
      const response = await api.get('/crypto-payments/tips/received');
      return response;
    } catch (error) {
      console.error('Failed to fetch received tips:', error);
      return { success: false, data: { tips: [] } };
    }
  }

  /**
   * Verify a transaction on blockchain
   * @param {String} txHash - Transaction hash
   * @param {Number} chainId - Chain ID
   */
  async verifyTransaction(txHash, chainId) {
    try {
      const response = await api.post('/crypto-payments/verify', {
        transactionHash: txHash,
        chainId
      });
      return response;
    } catch (error) {
      console.error('Failed to verify transaction:', error);
      throw error;
    }
  }

  /**
   * Get crypto prices (backend-cached prices)
   */
  async getCryptoPrices() {
    try {
      const response = await api.get('/crypto-payments/prices');
      return response;
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      // Fallback to mock prices
      return {
        success: true,
        data: {
          ETH: 2450.50,
          BTC: 45120.30,
          MATIC: 0.85,
          USDC: 1.00,
          USDT: 1.00,
          DAI: 1.00,
          CRYB: 1.85
        }
      };
    }
  }

  /**
   * Get user's payment balance/wallet
   */
  async getPaymentBalance() {
    try {
      const response = await api.get('/crypto-payments/balance');
      return response;
    } catch (error) {
      console.error('Failed to fetch payment balance:', error);
      return { success: false, data: { balance: {} } };
    }
  }

  /**
   * Withdraw earnings to wallet
   * @param {String} token - Token to withdraw
   * @param {String} amount - Amount to withdraw
   * @param {String} toAddress - Destination wallet address
   */
  async withdrawEarnings(token, amount, toAddress) {
    try {
      const response = await api.post('/crypto-payments/withdraw', {
        token,
        amount: amount.toString(),
        toAddress
      });
      return response;
    } catch (error) {
      console.error('Failed to withdraw earnings:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics for user
   */
  async getPaymentStats() {
    try {
      const response = await api.get('/crypto-payments/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch payment stats:', error);
      return {
        success: false,
        data: {
          totalPaid: 0,
          totalReceived: 0,
          transactionCount: 0
        }
      };
    }
  }
}

export default new CryptoPaymentAPI();
