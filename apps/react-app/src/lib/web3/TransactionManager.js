// CRYB Platform Advanced Transaction Manager
// Enterprise-grade transaction management with gas optimization and batching

import { ethers } from 'ethers';
import { walletManager } from './WalletManager.js';

// Transaction priority levels
export const TRANSACTION_PRIORITY = {
  SLOW: 'slow',
  STANDARD: 'standard',
  FAST: 'fast',
  INSTANT: 'instant'
};

// Transaction status enum
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  SUBMITTED: 'submitted',
  CONFIRMING: 'confirming',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REPLACED: 'replaced'
};

// Gas estimation strategies
export const GAS_STRATEGIES = {
  CONSERVATIVE: 'conservative',
  MODERATE: 'moderate',
  AGGRESSIVE: 'aggressive',
  CUSTOM: 'custom'
};

// Transaction batch types
export const BATCH_TYPES = {
  MULTICALL: 'multicall',
  SEQUENCE: 'sequence',
  PARALLEL: 'parallel'
};

class TransactionManager {
  constructor() {
    this.transactions = new Map();
    this.batches = new Map();
    this.gasOracle = new GasOracle();
    this.batchExecutor = new BatchExecutor();
    this.eventListeners = new Map();
    this.config = {
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      confirmationBlocks: 2,
      maxGasPrice: BigInt('100') * BigInt(10 ** 9), // 100 gwei
      gasMultiplier: 1.1, // 10% buffer
      batchDelay: 1000, // 1 second delay between batch items
      enableMEVProtection: true,
      enableGasOptimization: true
    };
    
    this.initialize();
  }

  async initialize() {
    // Setup gas oracle
    await this.gasOracle.initialize();
    
    // Setup transaction monitoring
    this.startTransactionMonitoring();
    
    // Setup batch processing
    this.startBatchProcessing();
  }

  // Main transaction execution method
  async executeTransaction(transaction, options = {}) {
    try {
      const txId = this.generateTransactionId();
      
      // Create transaction info object
      const txInfo = {
        id: txId,
        originalTransaction: { ...transaction },
        options: { ...options },
        status: TRANSACTION_STATUS.PENDING,
        attempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        gasUsed: null,
        receipt: null,
        error: null
      };

      this.transactions.set(txId, txInfo);
      this.emit('transactionCreated', txInfo);

      // Process transaction based on options
      if (options.batch) {
        return await this.addToBatch(txInfo, options.batch);
      } else {
        return await this.processSingleTransaction(txInfo);
      }
    } catch (error) {
      console.error('Transaction execution failed:', error);
      throw error;
    }
  }

  async processSingleTransaction(txInfo) {
    try {
      txInfo.status = TRANSACTION_STATUS.QUEUED;
      txInfo.updatedAt = Date.now();
      this.emit('transactionStatusChanged', txInfo);

      // Optimize gas settings
      const optimizedTx = await this.optimizeGasSettings(txInfo.originalTransaction, txInfo.options);
      
      // Add security checks
      await this.performSecurityChecks(optimizedTx, txInfo.options);
      
      // Submit transaction
      const result = await this.submitTransaction(optimizedTx, txInfo);
      
      return result;
    } catch (error) {
      txInfo.status = TRANSACTION_STATUS.FAILED;
      txInfo.error = error.message;
      txInfo.updatedAt = Date.now();
      this.emit('transactionFailed', txInfo);
      throw error;
    }
  }

  async optimizeGasSettings(transaction, options) {
    const optimizedTx = { ...transaction };
    const strategy = options.gasStrategy || GAS_STRATEGIES.MODERATE;
    const priority = options.priority || TRANSACTION_PRIORITY.STANDARD;

    try {
      // Get current gas prices
      const gasData = await this.gasOracle.getGasPrice(priority);
      
      // Apply gas strategy
      switch (strategy) {
        case GAS_STRATEGIES.CONSERVATIVE:
          optimizedTx.maxFeePerGas = gasData.standard.maxFeePerGas;
          optimizedTx.maxPriorityFeePerGas = gasData.standard.maxPriorityFeePerGas;
          break;
        case GAS_STRATEGIES.MODERATE:
          optimizedTx.maxFeePerGas = gasData.fast.maxFeePerGas;
          optimizedTx.maxPriorityFeePerGas = gasData.fast.maxPriorityFeePerGas;
          break;
        case GAS_STRATEGIES.AGGRESSIVE:
          optimizedTx.maxFeePerGas = gasData.instant.maxFeePerGas;
          optimizedTx.maxPriorityFeePerGas = gasData.instant.maxPriorityFeePerGas;
          break;
        case GAS_STRATEGIES.CUSTOM:
          if (options.gasPrice) {
            optimizedTx.gasPrice = options.gasPrice;
          } else {
            optimizedTx.maxFeePerGas = options.maxFeePerGas || gasData.standard.maxFeePerGas;
            optimizedTx.maxPriorityFeePerGas = options.maxPriorityFeePerGas || gasData.standard.maxPriorityFeePerGas;
          }
          break;
      }

      // Estimate gas limit if not provided
      if (!optimizedTx.gasLimit) {
        try {
          const estimatedGas = await walletManager.provider.estimateGas(optimizedTx);
          optimizedTx.gasLimit = BigInt(Math.floor(Number(estimatedGas) * this.config.gasMultiplier));
        } catch (error) {
          optimizedTx.gasLimit = BigInt(21000); // Default for simple transfers
        }
      }

      // Validate gas limits
      if (optimizedTx.maxFeePerGas > this.config.maxGasPrice) {
        throw new Error(`Gas price ${optimizedTx.maxFeePerGas} exceeds maximum ${this.config.maxGasPrice}`);
      }

      return optimizedTx;
    } catch (error) {
      console.error('Gas optimization failed:', error);
      throw error;
    }
  }

  async performSecurityChecks(transaction, options) {
    // MEV protection
    if (this.config.enableMEVProtection && options.mevProtection !== false) {
      await this.applyMEVProtection(transaction);
    }

    // Contract verification
    if (transaction.to) {
      await this.verifyContract(transaction.to);
    }

    // Transaction value limits
    if (transaction.value && BigInt(transaction.value) > BigInt('10') * BigInt(10 ** 18)) {
      if (!options.highValueConfirmed) {
        throw new Error('High value transaction requires explicit confirmation');
      }
    }

    // Simulate transaction
    if (options.simulate !== false) {
      await this.simulateTransaction(transaction);
    }
  }

  async applyMEVProtection(transaction) {
    // Add random delay to prevent timing attacks
    const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    // Add priority fee to compete with MEV bots
    if (transaction.maxPriorityFeePerGas) {
      transaction.maxPriorityFeePerGas = BigInt(Math.floor(Number(transaction.maxPriorityFeePerGas) * 1.2));
    }
  }

  async verifyContract(contractAddress) {
    try {
      const code = await walletManager.provider.getCode(contractAddress);
      if (code === '0x') {
        throw new Error('Address is not a contract');
      }
      
      // Additional contract verification could be added here
      // e.g., checking against known contract registries
    } catch (error) {
    }
  }

  async simulateTransaction(transaction) {
    try {
      // Use static call to simulate transaction
      if (transaction.data && transaction.to) {
        await walletManager.provider.call({
          to: transaction.to,
          data: transaction.data,
          value: transaction.value || 0,
          from: walletManager.account
        });
      }
    } catch (error) {
      throw new Error(`Transaction simulation failed: ${error.message}`);
    }
  }

  async submitTransaction(transaction, txInfo) {
    try {
      txInfo.status = TRANSACTION_STATUS.SUBMITTED;
      txInfo.attempts++;
      txInfo.updatedAt = Date.now();
      this.emit('transactionSubmitted', txInfo);

      // Send transaction
      const tx = await walletManager.signer.sendTransaction(transaction);
      
      txInfo.hash = tx.hash;
      txInfo.nonce = tx.nonce;
      txInfo.status = TRANSACTION_STATUS.CONFIRMING;
      txInfo.updatedAt = Date.now();
      this.emit('transactionConfirming', txInfo);

      // Monitor transaction
      this.monitorTransaction(txInfo, tx);

      return {
        hash: tx.hash,
        nonce: tx.nonce,
        txInfo
      };
    } catch (error) {
      // Handle different error types
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient funds for transaction');
      } else if (error.code === 'NONCE_EXPIRED') {
        throw new Error('Transaction nonce expired');
      } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
        throw new Error('Replacement transaction underpriced');
      } else {
        throw error;
      }
    }
  }

  async monitorTransaction(txInfo, tx) {
    try {
      // Wait for confirmation
      const receipt = await tx.wait(this.config.confirmationBlocks);
      
      txInfo.receipt = receipt;
      txInfo.gasUsed = receipt.gasUsed;
      txInfo.status = receipt.status === 1 ? TRANSACTION_STATUS.CONFIRMED : TRANSACTION_STATUS.FAILED;
      txInfo.updatedAt = Date.now();
      
      if (receipt.status === 1) {
        this.emit('transactionConfirmed', txInfo);
      } else {
        this.emit('transactionFailed', txInfo);
      }
    } catch (error) {
      // Handle timeout or other monitoring errors
      if (error.code === 'TIMEOUT') {
        await this.handleTransactionTimeout(txInfo);
      } else {
        txInfo.status = TRANSACTION_STATUS.FAILED;
        txInfo.error = error.message;
        txInfo.updatedAt = Date.now();
        this.emit('transactionFailed', txInfo);
      }
    }
  }

  async handleTransactionTimeout(txInfo) {
    try {
      // Check if transaction is still pending
      const currentNonce = await walletManager.provider.getTransactionCount(walletManager.account);
      
      if (txInfo.nonce < currentNonce) {
        // Transaction was replaced or confirmed
        txInfo.status = TRANSACTION_STATUS.REPLACED;
        txInfo.updatedAt = Date.now();
        this.emit('transactionReplaced', txInfo);
      } else if (txInfo.attempts < this.config.maxRetries) {
        // Retry with higher gas price
        await this.retryTransaction(txInfo);
      } else {
        // Give up after max retries
        txInfo.status = TRANSACTION_STATUS.FAILED;
        txInfo.error = 'Transaction timeout after maximum retries';
        txInfo.updatedAt = Date.now();
        this.emit('transactionFailed', txInfo);
      }
    } catch (error) {
      console.error('Error handling transaction timeout:', error);
    }
  }

  async retryTransaction(txInfo) {
    try {
      
      // Increase gas price for retry
      const retryTx = { ...txInfo.originalTransaction };
      if (retryTx.maxFeePerGas) {
        retryTx.maxFeePerGas = BigInt(Math.floor(Number(retryTx.maxFeePerGas) * 1.2));
      }
      if (retryTx.maxPriorityFeePerGas) {
        retryTx.maxPriorityFeePerGas = BigInt(Math.floor(Number(retryTx.maxPriorityFeePerGas) * 1.2));
      }
      if (retryTx.gasPrice) {
        retryTx.gasPrice = BigInt(Math.floor(Number(retryTx.gasPrice) * 1.2));
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      
      // Submit retry
      await this.submitTransaction(retryTx, txInfo);
    } catch (error) {
      console.error('Transaction retry failed:', error);
      txInfo.status = TRANSACTION_STATUS.FAILED;
      txInfo.error = `Retry failed: ${error.message}`;
      txInfo.updatedAt = Date.now();
      this.emit('transactionFailed', txInfo);
    }
  }

  // Batch transaction management
  async createBatch(batchId, type = BATCH_TYPES.SEQUENCE, options = {}) {
    const batch = {
      id: batchId,
      type,
      transactions: [],
      options,
      status: 'created',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.batches.set(batchId, batch);
    this.emit('batchCreated', batch);
    
    return batch;
  }

  async addToBatch(txInfo, batchId) {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    batch.transactions.push(txInfo);
    batch.updatedAt = Date.now();
    
    txInfo.batchId = batchId;
    this.emit('transactionAddedToBatch', { batch, txInfo });

    return batch;
  }

  async executeBatch(batchId) {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    batch.status = 'executing';
    batch.updatedAt = Date.now();
    this.emit('batchExecuting', batch);

    try {
      let results;
      
      switch (batch.type) {
        case BATCH_TYPES.MULTICALL:
          results = await this.batchExecutor.executeMulticall(batch);
          break;
        case BATCH_TYPES.SEQUENCE:
          results = await this.batchExecutor.executeSequence(batch);
          break;
        case BATCH_TYPES.PARALLEL:
          results = await this.batchExecutor.executeParallel(batch);
          break;
        default:
          throw new Error(`Unsupported batch type: ${batch.type}`);
      }

      batch.status = 'completed';
      batch.results = results;
      batch.updatedAt = Date.now();
      this.emit('batchCompleted', batch);

      return results;
    } catch (error) {
      batch.status = 'failed';
      batch.error = error.message;
      batch.updatedAt = Date.now();
      this.emit('batchFailed', batch);
      throw error;
    }
  }

  // Transaction cancellation
  async cancelTransaction(txId) {
    const txInfo = this.transactions.get(txId);
    if (!txInfo) {
      throw new Error('Transaction not found');
    }

    if (txInfo.status !== TRANSACTION_STATUS.SUBMITTED && txInfo.status !== TRANSACTION_STATUS.CONFIRMING) {
      throw new Error('Transaction cannot be cancelled in current status');
    }

    try {
      // Send cancellation transaction with same nonce but higher gas price
      const cancelTx = {
        to: walletManager.account,
        value: 0,
        nonce: txInfo.nonce,
        gasLimit: BigInt(21000),
        maxFeePerGas: BigInt(Math.floor(Number(txInfo.originalTransaction.maxFeePerGas || 0) * 1.5)),
        maxPriorityFeePerGas: BigInt(Math.floor(Number(txInfo.originalTransaction.maxPriorityFeePerGas || 0) * 1.5))
      };

      const cancelResult = await walletManager.signer.sendTransaction(cancelTx);
      
      txInfo.status = TRANSACTION_STATUS.CANCELLED;
      txInfo.cancellationHash = cancelResult.hash;
      txInfo.updatedAt = Date.now();
      
      this.emit('transactionCancelled', txInfo);
      
      return cancelResult;
    } catch (error) {
      console.error('Transaction cancellation failed:', error);
      throw error;
    }
  }

  // Speed up transaction
  async speedUpTransaction(txId, gasMultiplier = 1.2) {
    const txInfo = this.transactions.get(txId);
    if (!txInfo) {
      throw new Error('Transaction not found');
    }

    if (txInfo.status !== TRANSACTION_STATUS.SUBMITTED && txInfo.status !== TRANSACTION_STATUS.CONFIRMING) {
      throw new Error('Transaction cannot be sped up in current status');
    }

    try {
      // Create speed-up transaction with higher gas price
      const speedUpTx = { ...txInfo.originalTransaction };
      speedUpTx.nonce = txInfo.nonce;
      
      if (speedUpTx.maxFeePerGas) {
        speedUpTx.maxFeePerGas = BigInt(Math.floor(Number(speedUpTx.maxFeePerGas) * gasMultiplier));
      }
      if (speedUpTx.maxPriorityFeePerGas) {
        speedUpTx.maxPriorityFeePerGas = BigInt(Math.floor(Number(speedUpTx.maxPriorityFeePerGas) * gasMultiplier));
      }
      if (speedUpTx.gasPrice) {
        speedUpTx.gasPrice = BigInt(Math.floor(Number(speedUpTx.gasPrice) * gasMultiplier));
      }

      const speedUpResult = await walletManager.signer.sendTransaction(speedUpTx);
      
      txInfo.hash = speedUpResult.hash;
      txInfo.speedUpHashes = txInfo.speedUpHashes || [];
      txInfo.speedUpHashes.push(speedUpResult.hash);
      txInfo.updatedAt = Date.now();
      
      this.emit('transactionSpedUp', txInfo);
      
      return speedUpResult;
    } catch (error) {
      console.error('Transaction speed up failed:', error);
      throw error;
    }
  }

  // Monitoring and maintenance
  startTransactionMonitoring() {
    setInterval(() => {
      this.cleanupOldTransactions();
      this.checkPendingTransactions();
    }, 30000); // Every 30 seconds
  }

  startBatchProcessing() {
    setInterval(() => {
      this.processPendingBatches();
    }, 5000); // Every 5 seconds
  }

  cleanupOldTransactions() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [txId, txInfo] of this.transactions) {
      if (txInfo.createdAt < cutoffTime && 
          (txInfo.status === TRANSACTION_STATUS.CONFIRMED || 
           txInfo.status === TRANSACTION_STATUS.FAILED ||
           txInfo.status === TRANSACTION_STATUS.CANCELLED)) {
        this.transactions.delete(txId);
      }
    }
  }

  checkPendingTransactions() {
    for (const [txId, txInfo] of this.transactions) {
      if (txInfo.status === TRANSACTION_STATUS.CONFIRMING) {
        const timeElapsed = Date.now() - txInfo.updatedAt;
        if (timeElapsed > 300000) { // 5 minutes
          this.handleTransactionTimeout(txInfo);
        }
      }
    }
  }

  processPendingBatches() {
    for (const [batchId, batch] of this.batches) {
      if (batch.status === 'created' && batch.options.autoExecute) {
        this.executeBatch(batchId);
      }
    }
  }

  // Utility methods
  generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTransaction(txId) {
    return this.transactions.get(txId);
  }

  getBatch(batchId) {
    return this.batches.get(batchId);
  }

  getAllTransactions() {
    return Array.from(this.transactions.values());
  }

  getAllBatches() {
    return Array.from(this.batches.values());
  }

  getPendingTransactions() {
    return this.getAllTransactions().filter(tx => 
      tx.status === TRANSACTION_STATUS.PENDING ||
      tx.status === TRANSACTION_STATUS.QUEUED ||
      tx.status === TRANSACTION_STATUS.SUBMITTED ||
      tx.status === TRANSACTION_STATUS.CONFIRMING
    );
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      });
    }
  }
}

// Gas Oracle for real-time gas price tracking
class GasOracle {
  constructor() {
    this.gasData = null;
    this.lastUpdate = 0;
    this.updateInterval = 15000; // 15 seconds
  }

  async initialize() {
    await this.updateGasData();
    
    // Setup periodic updates
    setInterval(() => {
      this.updateGasData();
    }, this.updateInterval);
  }

  async updateGasData() {
    try {
      // Get current base fee
      const block = await walletManager.provider.getBlock('latest');
      const baseFee = block.baseFeePerGas || BigInt(0);
      
      // Calculate priority fees for different speeds
      const slowPriorityFee = BigInt(1) * BigInt(10 ** 9); // 1 gwei
      const standardPriorityFee = BigInt(2) * BigInt(10 ** 9); // 2 gwei
      const fastPriorityFee = BigInt(3) * BigInt(10 ** 9); // 3 gwei
      const instantPriorityFee = BigInt(5) * BigInt(10 ** 9); // 5 gwei
      
      this.gasData = {
        baseFee,
        slow: {
          maxFeePerGas: baseFee + slowPriorityFee,
          maxPriorityFeePerGas: slowPriorityFee,
          estimatedTime: '> 5 min'
        },
        standard: {
          maxFeePerGas: baseFee + standardPriorityFee,
          maxPriorityFeePerGas: standardPriorityFee,
          estimatedTime: '~ 2 min'
        },
        fast: {
          maxFeePerGas: baseFee + fastPriorityFee,
          maxPriorityFeePerGas: fastPriorityFee,
          estimatedTime: '~ 1 min'
        },
        instant: {
          maxFeePerGas: baseFee + instantPriorityFee,
          maxPriorityFeePerGas: instantPriorityFee,
          estimatedTime: '~ 15 sec'
        }
      };
      
      this.lastUpdate = Date.now();
    } catch (error) {
      console.error('Failed to update gas data:', error);
    }
  }

  async getGasPrice(priority = TRANSACTION_PRIORITY.STANDARD) {
    if (!this.gasData || Date.now() - this.lastUpdate > this.updateInterval) {
      await this.updateGasData();
    }
    
    return this.gasData;
  }
}

// Batch Executor for handling different batch types
class BatchExecutor {
  async executeMulticall(batch) {
    // Multicall implementation would use a multicall contract
    // For now, we'll simulate it by executing transactions sequentially
    const results = [];
    
    for (const txInfo of batch.transactions) {
      try {
        const result = await this.executeSingleFromBatch(txInfo);
        results.push({ txInfo, result, success: true });
      } catch (error) {
        results.push({ txInfo, error: error.message, success: false });
      }
    }
    
    return results;
  }

  async executeSequence(batch) {
    const results = [];
    
    for (let i = 0; i < batch.transactions.length; i++) {
      const txInfo = batch.transactions[i];
      
      try {
        const result = await this.executeSingleFromBatch(txInfo);
        results.push({ txInfo, result, success: true });
        
        // Add delay between transactions if specified
        if (i < batch.transactions.length - 1 && batch.options.delay) {
          await new Promise(resolve => setTimeout(resolve, batch.options.delay));
        }
      } catch (error) {
        results.push({ txInfo, error: error.message, success: false });
        
        // Stop execution on first failure if specified
        if (batch.options.stopOnFailure) {
          break;
        }
      }
    }
    
    return results;
  }

  async executeParallel(batch) {
    const promises = batch.transactions.map(async (txInfo) => {
      try {
        const result = await this.executeSingleFromBatch(txInfo);
        return { txInfo, result, success: true };
      } catch (error) {
        return { txInfo, error: error.message, success: false };
      }
    });
    
    return await Promise.all(promises);
  }

  async executeSingleFromBatch(txInfo) {
    // Execute the transaction from the batch
    const optimizedTx = await transactionManager.optimizeGasSettings(
      txInfo.originalTransaction,
      txInfo.options
    );
    
    return await transactionManager.submitTransaction(optimizedTx, txInfo);
  }
}

// Create singleton instance
export const transactionManager = new TransactionManager();

// Export utility functions
export function useTransactionManager() {
  return transactionManager;
}

export function formatGasPrice(gasPrice) {
  return ethers.formatUnits(gasPrice, 'gwei') + ' gwei';
}

export function estimateTransactionCost(gasLimit, gasPrice) {
  return BigInt(gasLimit) * BigInt(gasPrice);
}

export default transactionManager;