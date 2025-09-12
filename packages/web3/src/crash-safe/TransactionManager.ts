import { WalletClient, PublicClient, Hash, TransactionReceipt, parseEther, formatEther } from 'viem';
import { connectionManager } from './ConnectionManager';
import { walletConnectionManager } from './WalletConnectionManager';

export interface TransactionRequest {
  to: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  chainId?: number;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  estimatedCostUsd?: number;
  confidence: 'low' | 'medium' | 'high';
  speed: 'slow' | 'standard' | 'fast';
}

export interface TransactionStatus {
  hash: Hash;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'replaced';
  confirmations: number;
  receipt?: TransactionReceipt;
  error?: string;
  submittedAt: number;
  confirmedAt?: number;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
}

export interface TransactionConfig {
  maxRetries: number;
  retryDelay: number;
  confirmationBlocks: number;
  timeoutMs: number;
  gasMultiplier: number;
  maxGasPrice: bigint;
  enableReplacementTx: boolean;
  replacementMultiplier: number;
}

export interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  cancelledTransactions: number;
  averageConfirmationTime: number;
  averageGasUsed: bigint;
  totalFeesSpent: bigint;
}

export class CrashSafeTransactionManager {
  private pendingTransactions = new Map<Hash, TransactionStatus>();
  private transactionHistory = new Map<Hash, TransactionStatus>();
  private gasPriceCache = new Map<number, { price: bigint; timestamp: number }>();
  private confirmationTimers = new Map<Hash, NodeJS.Timeout>();
  private metrics: TransactionMetrics = {
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    cancelledTransactions: 0,
    averageConfirmationTime: 0,
    averageGasUsed: BigInt(0),
    totalFeesSpent: BigInt(0)
  };

  private readonly config: TransactionConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    confirmationBlocks: 12,
    timeoutMs: 600000, // 10 minutes
    gasMultiplier: 1.1,
    maxGasPrice: parseEther('0.01'), // 0.01 ETH in gwei equivalent
    enableReplacementTx: true,
    replacementMultiplier: 1.125 // 12.5% increase for replacements
  };

  private logger = console;

  constructor(config?: Partial<TransactionConfig>) {
    this.config = { ...this.config, ...config };
    this.startCleanupTimer();
  }

  public async estimateGas(
    transaction: TransactionRequest,
    options?: {
      speed?: 'slow' | 'standard' | 'fast';
      includeUsdEstimate?: boolean;
    }
  ): Promise<GasEstimate> {
    const speed = options?.speed || 'standard';
    
    try {
      const chainId = transaction.chainId || walletConnectionManager.getChainId() || 1;
      const publicClient = await connectionManager.getPublicClient(chainId);
      
      // Estimate gas limit
      let gasLimit: bigint;
      try {
        gasLimit = await publicClient.estimateGas({
          to: transaction.to as `0x${string}`,
          value: transaction.value || BigInt(0),
          data: transaction.data as `0x${string}` || '0x',
          account: walletConnectionManager.getAccount() as `0x${string}`
        });
        
        // Apply safety multiplier
        gasLimit = BigInt(Math.floor(Number(gasLimit) * this.config.gasMultiplier));
      } catch (error: any) {
        this.logger.warn('Gas estimation failed, using fallback:', error);
        gasLimit = BigInt(21000); // Basic transfer gas limit
        
        if (transaction.data && transaction.data !== '0x') {
          gasLimit = BigInt(200000); // Contract interaction fallback
        }
      }

      // Get gas prices
      const gasPrices = await this.getGasPrices(chainId, speed);
      
      // Calculate estimated cost
      const estimatedCost = gasLimit * (gasPrices.maxFeePerGas || gasPrices.gasPrice || BigInt(0));
      
      // Get USD estimate if requested
      let estimatedCostUsd: number | undefined;
      if (options?.includeUsdEstimate) {
        try {
          estimatedCostUsd = await this.convertToUsd(estimatedCost, chainId);
        } catch (error) {
          this.logger.warn('Failed to get USD estimate:', error);
        }
      }

      return {
        gasLimit,
        gasPrice: gasPrices.gasPrice,
        maxFeePerGas: gasPrices.maxFeePerGas,
        maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
        estimatedCost,
        estimatedCostUsd,
        confidence: this.calculateGasConfidence(gasPrices, chainId),
        speed
      };
    } catch (error: any) {
      this.logger.error('Gas estimation failed:', error);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  public async sendTransaction(
    transaction: TransactionRequest,
    options?: {
      waitForConfirmation?: boolean;
      confirmationBlocks?: number;
      onStatusUpdate?: (status: TransactionStatus) => void;
    }
  ): Promise<Hash> {
    const walletClient = await this.getWalletClient(transaction.chainId);
    const publicClient = await connectionManager.getPublicClient(
      transaction.chainId || walletConnectionManager.getChainId() || 1
    );

    // Prepare transaction with gas estimation
    const preparedTx = await this.prepareTransaction(transaction);
    
    let hash: Hash;
    let attempt = 0;
    
    while (attempt < this.config.maxRetries) {
      try {
        hash = await this.submitTransaction(walletClient, preparedTx);
        break;
      } catch (error: any) {
        attempt++;
        
        if (this.isUserRejectionError(error)) {
          throw new Error('Transaction was rejected by user');
        }
        
        if (this.isNonceError(error)) {
          // Update nonce and retry
          preparedTx.nonce = await this.getCurrentNonce(walletClient.account?.address || '');
          continue;
        }
        
        if (this.isGasPriceError(error)) {
          // Increase gas price and retry
          await this.adjustGasPrice(preparedTx);
          continue;
        }
        
        if (attempt >= this.config.maxRetries) {
          throw new Error(`Transaction failed after ${this.config.maxRetries} attempts: ${error.message}`);
        }
        
        await this.delay(this.config.retryDelay * attempt);
      }
    }

    // Track transaction
    const txStatus: TransactionStatus = {
      hash: hash!,
      status: 'pending',
      confirmations: 0,
      submittedAt: Date.now()
    };

    this.pendingTransactions.set(hash!, txStatus);
    this.metrics.totalTransactions++;

    // Setup confirmation monitoring
    if (options?.waitForConfirmation !== false) {
      this.monitorTransaction(hash!, publicClient, options?.confirmationBlocks, options?.onStatusUpdate);
    }

    return hash!;
  }

  public async cancelTransaction(
    hash: Hash,
    gasPrice?: bigint
  ): Promise<Hash | null> {
    const txStatus = this.pendingTransactions.get(hash);
    if (!txStatus || txStatus.status !== 'pending') {
      throw new Error('Transaction is not pending or not found');
    }

    if (!this.config.enableReplacementTx) {
      throw new Error('Transaction replacement is disabled');
    }

    try {
      const chainId = walletConnectionManager.getChainId();
      if (!chainId) throw new Error('No chain ID available');

      const walletClient = await this.getWalletClient(chainId);
      const account = walletClient.account?.address;
      if (!account) throw new Error('No account available');

      // Get original transaction details
      const publicClient = await connectionManager.getPublicClient(chainId);
      const originalTx = await publicClient.getTransaction({ hash });

      // Create cancellation transaction (same nonce, higher gas, to self)
      const cancelTx: TransactionRequest = {
        to: account,
        value: BigInt(0),
        gasLimit: BigInt(21000),
        nonce: Number(originalTx.nonce),
        chainId
      };

      // Use higher gas price
      const currentGasPrices = await this.getGasPrices(chainId, 'fast');
      const replacementGasPrice = gasPrice || 
        (currentGasPrices.gasPrice ? 
          BigInt(Math.floor(Number(currentGasPrices.gasPrice) * this.config.replacementMultiplier)) : 
          BigInt(0));

      if (currentGasPrices.maxFeePerGas) {
        cancelTx.maxFeePerGas = BigInt(Math.floor(Number(currentGasPrices.maxFeePerGas) * this.config.replacementMultiplier));
        cancelTx.maxPriorityFeePerGas = currentGasPrices.maxPriorityFeePerGas;
      } else {
        cancelTx.gasPrice = replacementGasPrice;
      }

      const cancelHash = await this.submitTransaction(walletClient, cancelTx);

      // Update original transaction status
      txStatus.status = 'cancelled';
      this.pendingTransactions.delete(hash);
      this.transactionHistory.set(hash, txStatus);
      this.metrics.cancelledTransactions++;

      return cancelHash;
    } catch (error: any) {
      this.logger.error('Failed to cancel transaction:', error);
      return null;
    }
  }

  public async speedUpTransaction(
    hash: Hash,
    gasIncrease?: number
  ): Promise<Hash | null> {
    const txStatus = this.pendingTransactions.get(hash);
    if (!txStatus || txStatus.status !== 'pending') {
      throw new Error('Transaction is not pending or not found');
    }

    if (!this.config.enableReplacementTx) {
      throw new Error('Transaction replacement is disabled');
    }

    try {
      const chainId = walletConnectionManager.getChainId();
      if (!chainId) throw new Error('No chain ID available');

      const publicClient = await connectionManager.getPublicClient(chainId);
      const originalTx = await publicClient.getTransaction({ hash });

      // Create speed-up transaction (same parameters, higher gas)
      const speedUpTx: TransactionRequest = {
        to: originalTx.to!,
        value: originalTx.value,
        data: originalTx.input,
        gasLimit: originalTx.gas,
        nonce: Number(originalTx.nonce),
        chainId
      };

      // Calculate higher gas price
      const increase = gasIncrease || this.config.replacementMultiplier;
      
      if (originalTx.maxFeePerGas) {
        speedUpTx.maxFeePerGas = BigInt(Math.floor(Number(originalTx.maxFeePerGas) * increase));
        speedUpTx.maxPriorityFeePerGas = originalTx.maxPriorityFeePerGas ? 
          BigInt(Math.floor(Number(originalTx.maxPriorityFeePerGas) * increase)) : undefined;
      } else if (originalTx.gasPrice) {
        speedUpTx.gasPrice = BigInt(Math.floor(Number(originalTx.gasPrice) * increase));
      }

      const walletClient = await this.getWalletClient(chainId);
      const speedUpHash = await this.submitTransaction(walletClient, speedUpTx);

      // Update original transaction status
      txStatus.status = 'replaced';
      this.pendingTransactions.delete(hash);
      this.transactionHistory.set(hash, txStatus);

      // Track new transaction
      const newTxStatus: TransactionStatus = {
        hash: speedUpHash,
        status: 'pending',
        confirmations: 0,
        submittedAt: Date.now()
      };

      this.pendingTransactions.set(speedUpHash, newTxStatus);
      this.monitorTransaction(speedUpHash, publicClient);

      return speedUpHash;
    } catch (error: any) {
      this.logger.error('Failed to speed up transaction:', error);
      return null;
    }
  }

  private async prepareTransaction(tx: TransactionRequest): Promise<TransactionRequest> {
    const chainId = tx.chainId || walletConnectionManager.getChainId() || 1;
    const account = walletConnectionManager.getAccount();
    
    if (!account) {
      throw new Error('No wallet connected');
    }

    const preparedTx = { ...tx, chainId };

    // Set nonce if not provided
    if (preparedTx.nonce === undefined) {
      preparedTx.nonce = await this.getCurrentNonce(account);
    }

    // Estimate and set gas if not provided
    if (!preparedTx.gasLimit) {
      const gasEstimate = await this.estimateGas(preparedTx);
      preparedTx.gasLimit = gasEstimate.gasLimit;
      preparedTx.maxFeePerGas = gasEstimate.maxFeePerGas;
      preparedTx.maxPriorityFeePerGas = gasEstimate.maxPriorityFeePerGas;
      preparedTx.gasPrice = gasEstimate.gasPrice;
    }

    return preparedTx;
  }

  private async submitTransaction(
    walletClient: WalletClient,
    transaction: TransactionRequest
  ): Promise<Hash> {
    // Validate transaction before submission
    await this.validateTransaction(transaction);

    return await walletClient.sendTransaction({
      to: transaction.to as `0x${string}`,
      value: transaction.value || BigInt(0),
      data: transaction.data as `0x${string}`,
      gas: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
      maxFeePerGas: transaction.maxFeePerGas,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
      nonce: transaction.nonce,
      chain: undefined // Let wallet client handle chain
    });
  }

  private async validateTransaction(transaction: TransactionRequest): Promise<void> {
    // Check if recipient address is valid
    if (!transaction.to.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid recipient address');
    }

    // Check for sufficient balance
    const account = walletConnectionManager.getAccount();
    if (account && transaction.value) {
      const publicClient = await connectionManager.getPublicClient(
        transaction.chainId || walletConnectionManager.getChainId() || 1
      );
      
      const balance = await publicClient.getBalance({
        address: account as `0x${string}`
      });

      const totalCost = transaction.value + (transaction.gasLimit || BigInt(0)) * (transaction.gasPrice || transaction.maxFeePerGas || BigInt(0));
      
      if (balance < totalCost) {
        throw new Error('Insufficient balance for transaction');
      }
    }

    // Validate gas prices
    if (transaction.maxFeePerGas && transaction.maxFeePerGas > this.config.maxGasPrice) {
      throw new Error('Gas price exceeds maximum allowed');
    }
  }

  private async monitorTransaction(
    hash: Hash,
    publicClient: PublicClient,
    confirmationBlocks = this.config.confirmationBlocks,
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<void> {
    let attempts = 0;
    const maxAttempts = this.config.timeoutMs / 5000; // Check every 5 seconds

    const checkStatus = async () => {
      try {
        const txStatus = this.pendingTransactions.get(hash);
        if (!txStatus) return; // Transaction was removed

        const receipt = await publicClient.getTransactionReceipt({ hash }).catch(() => null);
        
        if (receipt) {
          const currentBlock = await publicClient.getBlockNumber();
          const confirmations = Number(currentBlock - receipt.blockNumber);

          txStatus.receipt = receipt;
          txStatus.confirmations = confirmations;
          txStatus.gasUsed = receipt.gasUsed;
          txStatus.effectiveGasPrice = receipt.effectiveGasPrice;

          if (receipt.status === 'success' && confirmations >= confirmationBlocks) {
            txStatus.status = 'confirmed';
            txStatus.confirmedAt = Date.now();
            
            this.pendingTransactions.delete(hash);
            this.transactionHistory.set(hash, txStatus);
            this.updateMetrics(txStatus);
            
            if (onStatusUpdate) {
              onStatusUpdate(txStatus);
            }
            return;
          } else if (receipt.status === 'reverted') {
            txStatus.status = 'failed';
            txStatus.error = 'Transaction reverted';
            
            this.pendingTransactions.delete(hash);
            this.transactionHistory.set(hash, txStatus);
            this.metrics.failedTransactions++;
            
            if (onStatusUpdate) {
              onStatusUpdate(txStatus);
            }
            return;
          }
          
          if (onStatusUpdate) {
            onStatusUpdate(txStatus);
          }
        }

        attempts++;
        if (attempts >= maxAttempts) {
          txStatus.status = 'failed';
          txStatus.error = 'Transaction timeout';
          
          this.pendingTransactions.delete(hash);
          this.transactionHistory.set(hash, txStatus);
          this.metrics.failedTransactions++;
          
          if (onStatusUpdate) {
            onStatusUpdate(txStatus);
          }
          return;
        }

        // Schedule next check
        const timer = setTimeout(checkStatus, 5000);
        this.confirmationTimers.set(hash, timer);
      } catch (error) {
        this.logger.error(`Error monitoring transaction ${hash}:`, error);
        
        // Schedule retry
        const timer = setTimeout(checkStatus, 10000);
        this.confirmationTimers.set(hash, timer);
      }
    };

    checkStatus();
  }

  private async getGasPrices(
    chainId: number,
    speed: 'slow' | 'standard' | 'fast'
  ): Promise<{ gasPrice?: bigint; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint }> {
    try {
      const publicClient = await connectionManager.getPublicClient(chainId);
      
      // Check cache first
      const cached = this.gasPriceCache.get(chainId);
      if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache
        return this.calculateGasPriceForSpeed(cached.price, speed);
      }

      // Try to get EIP-1559 gas prices
      try {
        const feeData = await publicClient.estimateFeesPerGas();
        
        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
          const baseFee = feeData.maxFeePerGas - feeData.maxPriorityFeePerGas;
          this.gasPriceCache.set(chainId, { price: baseFee, timestamp: Date.now() });
          
          return this.calculateEip1559GasForSpeed(baseFee, feeData.maxPriorityFeePerGas, speed);
        }
      } catch (eip1559Error) {
        this.logger.warn('EIP-1559 gas estimation failed, falling back to legacy:', eip1559Error);
      }

      // Fallback to legacy gas price
      const gasPrice = await publicClient.getGasPrice();
      this.gasPriceCache.set(chainId, { price: gasPrice, timestamp: Date.now() });
      
      return this.calculateGasPriceForSpeed(gasPrice, speed);
    } catch (error: any) {
      this.logger.error('Failed to get gas prices:', error);
      
      // Use fallback gas prices
      const fallbackPrice = BigInt(20000000000); // 20 gwei
      return this.calculateGasPriceForSpeed(fallbackPrice, speed);
    }
  }

  private calculateGasPriceForSpeed(
    basePrice: bigint,
    speed: 'slow' | 'standard' | 'fast'
  ): { gasPrice: bigint } {
    const multipliers = {
      slow: 0.85,
      standard: 1.0,
      fast: 1.25
    };

    return {
      gasPrice: BigInt(Math.floor(Number(basePrice) * multipliers[speed]))
    };
  }

  private calculateEip1559GasForSpeed(
    baseFee: bigint,
    priorityFee: bigint,
    speed: 'slow' | 'standard' | 'fast'
  ): { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } {
    const multipliers = {
      slow: { base: 1.0, priority: 0.5 },
      standard: { base: 1.125, priority: 1.0 },
      fast: { base: 1.25, priority: 1.5 }
    };

    const mult = multipliers[speed];
    
    return {
      maxFeePerGas: BigInt(Math.floor(Number(baseFee) * mult.base)) + BigInt(Math.floor(Number(priorityFee) * mult.priority)),
      maxPriorityFeePerGas: BigInt(Math.floor(Number(priorityFee) * mult.priority))
    };
  }

  private calculateGasConfidence(
    gasPrices: any,
    chainId: number
  ): 'low' | 'medium' | 'high' {
    // This would implement more sophisticated confidence calculation
    // based on network conditions, historical data, etc.
    return 'medium';
  }

  private async convertToUsd(amount: bigint, chainId: number): Promise<number> {
    // This would integrate with price APIs to convert native token to USD
    // For now, return a placeholder
    return Number(formatEther(amount)) * 2000; // Assume ~$2000 ETH
  }

  private async getCurrentNonce(address: string): Promise<number> {
    const chainId = walletConnectionManager.getChainId();
    if (!chainId) throw new Error('No chain ID available');

    const publicClient = await connectionManager.getPublicClient(chainId);
    return await publicClient.getTransactionCount({
      address: address as `0x${string}`,
      blockTag: 'pending'
    });
  }

  private async getWalletClient(chainId?: number): Promise<WalletClient> {
    const targetChainId = chainId || walletConnectionManager.getChainId();
    if (!targetChainId) {
      throw new Error('No chain ID available');
    }

    const walletClient = await connectionManager.getWalletClient(targetChainId);
    if (!walletClient) {
      throw new Error('No wallet client available');
    }

    return walletClient;
  }

  private isUserRejectionError(error: any): boolean {
    return error.code === 4001 || 
           error.message?.includes('User rejected') ||
           error.message?.includes('User denied');
  }

  private isNonceError(error: any): boolean {
    return error.message?.includes('nonce') ||
           error.message?.includes('replacement transaction underpriced');
  }

  private isGasPriceError(error: any): boolean {
    return error.message?.includes('gas price') ||
           error.message?.includes('insufficient funds') ||
           error.message?.includes('underpriced');
  }

  private async adjustGasPrice(transaction: TransactionRequest): Promise<void> {
    const increase = this.config.replacementMultiplier;
    
    if (transaction.maxFeePerGas) {
      transaction.maxFeePerGas = BigInt(Math.floor(Number(transaction.maxFeePerGas) * increase));
      if (transaction.maxPriorityFeePerGas) {
        transaction.maxPriorityFeePerGas = BigInt(Math.floor(Number(transaction.maxPriorityFeePerGas) * increase));
      }
    } else if (transaction.gasPrice) {
      transaction.gasPrice = BigInt(Math.floor(Number(transaction.gasPrice) * increase));
    }
  }

  private updateMetrics(txStatus: TransactionStatus): void {
    if (txStatus.status === 'confirmed') {
      this.metrics.successfulTransactions++;
      
      if (txStatus.confirmedAt && txStatus.submittedAt) {
        const confirmationTime = txStatus.confirmedAt - txStatus.submittedAt;
        this.metrics.averageConfirmationTime = 
          (this.metrics.averageConfirmationTime * (this.metrics.successfulTransactions - 1) + confirmationTime) / 
          this.metrics.successfulTransactions;
      }
      
      if (txStatus.gasUsed) {
        this.metrics.averageGasUsed = 
          (this.metrics.averageGasUsed * BigInt(this.metrics.successfulTransactions - 1) + txStatus.gasUsed) / 
          BigInt(this.metrics.successfulTransactions);
      }
      
      if (txStatus.gasUsed && txStatus.effectiveGasPrice) {
        const fee = txStatus.gasUsed * txStatus.effectiveGasPrice;
        this.metrics.totalFeesSpent += fee;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupCompletedTransactions();
    }, 300000); // Clean up every 5 minutes
  }

  private cleanupCompletedTransactions(): void {
    const oneDayAgo = Date.now() - 86400000; // 24 hours
    
    for (const [hash, txStatus] of this.transactionHistory) {
      if (txStatus.submittedAt < oneDayAgo) {
        this.transactionHistory.delete(hash);
      }
    }
  }

  // Public getters
  public getPendingTransactions(): TransactionStatus[] {
    return Array.from(this.pendingTransactions.values());
  }

  public getTransactionHistory(): TransactionStatus[] {
    return Array.from(this.transactionHistory.values());
  }

  public getTransactionStatus(hash: Hash): TransactionStatus | null {
    return this.pendingTransactions.get(hash) || this.transactionHistory.get(hash) || null;
  }

  public getMetrics(): TransactionMetrics {
    return { ...this.metrics };
  }

  public cleanup(): void {
    // Clear all timers
    for (const timer of this.confirmationTimers.values()) {
      clearTimeout(timer);
    }
    this.confirmationTimers.clear();

    // Clear data structures
    this.pendingTransactions.clear();
    this.transactionHistory.clear();
    this.gasPriceCache.clear();
  }
}

// Export singleton instance
export const transactionManager = new CrashSafeTransactionManager();