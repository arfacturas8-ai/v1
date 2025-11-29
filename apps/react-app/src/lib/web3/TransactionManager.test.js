// Comprehensive tests for TransactionManager
import { jest } from '@jest/globals';
import { ethers } from 'ethers';
import {
  TransactionManager,
  transactionManager,
  TRANSACTION_PRIORITY,
  TRANSACTION_STATUS,
  GAS_STRATEGIES,
  BATCH_TYPES,
  formatGasPrice,
  estimateTransactionCost
} from './TransactionManager.js';

// Mock dependencies
jest.mock('ethers');
jest.mock('./WalletManager.js', () => ({
  walletManager: {
    provider: {
      estimateGas: jest.fn(),
      getBlock: jest.fn(),
      getCode: jest.fn(),
      call: jest.fn(),
      getTransactionCount: jest.fn()
    },
    signer: {
      sendTransaction: jest.fn()
    },
    account: '0x1234567890123456789012345678901234567890'
  }
}));

describe('TransactionManager', () => {
  let manager;
  let mockProvider;
  let mockSigner;
  let mockWalletManager;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Get mocked wallet manager
    mockWalletManager = require('./WalletManager.js').walletManager;
    mockProvider = mockWalletManager.provider;
    mockSigner = mockWalletManager.signer;

    // Setup default mock responses
    mockProvider.getBlock.mockResolvedValue({
      baseFeePerGas: BigInt(30) * BigInt(10 ** 9) // 30 gwei
    });

    mockProvider.estimateGas.mockResolvedValue(BigInt(21000));
    mockProvider.getCode.mockResolvedValue('0x123456');
    mockProvider.call.mockResolvedValue('0x');
    mockProvider.getTransactionCount.mockResolvedValue(5);

    mockSigner.sendTransaction.mockResolvedValue({
      hash: '0xabcdef1234567890',
      nonce: 1,
      wait: jest.fn().mockResolvedValue({
        status: 1,
        gasUsed: BigInt(21000),
        blockNumber: 12345
      })
    });

    // Create fresh manager instance
    manager = new TransactionManager();

    // Skip async initialization for most tests
    jest.spyOn(manager, 'initialize').mockResolvedValue();
    jest.spyOn(manager.gasOracle, 'initialize').mockResolvedValue();
    jest.spyOn(manager.gasOracle, 'getGasPrice').mockResolvedValue({
      baseFee: BigInt(30) * BigInt(10 ** 9),
      slow: {
        maxFeePerGas: BigInt(31) * BigInt(10 ** 9),
        maxPriorityFeePerGas: BigInt(1) * BigInt(10 ** 9),
        estimatedTime: '> 5 min'
      },
      standard: {
        maxFeePerGas: BigInt(32) * BigInt(10 ** 9),
        maxPriorityFeePerGas: BigInt(2) * BigInt(10 ** 9),
        estimatedTime: '~ 2 min'
      },
      fast: {
        maxFeePerGas: BigInt(33) * BigInt(10 ** 9),
        maxPriorityFeePerGas: BigInt(3) * BigInt(10 ** 9),
        estimatedTime: '~ 1 min'
      },
      instant: {
        maxFeePerGas: BigInt(35) * BigInt(10 ** 9),
        maxPriorityFeePerGas: BigInt(5) * BigInt(10 ** 9),
        estimatedTime: '~ 15 sec'
      }
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Transaction Creation', () => {
    test('should create a transaction with correct initial state', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: ethers.parseEther('1.0'),
        data: '0x'
      };

      const eventSpy = jest.fn();
      manager.on('transactionCreated', eventSpy);

      await manager.executeTransaction(transaction);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          originalTransaction: transaction,
          status: TRANSACTION_STATUS.PENDING,
          attempts: 0,
          gasUsed: null,
          receipt: null,
          error: null
        })
      );
    });

    test('should generate unique transaction IDs', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const result1 = await manager.executeTransaction(transaction);
      const result2 = await manager.executeTransaction(transaction);

      const tx1 = manager.getTransaction(result1.txInfo.id);
      const tx2 = manager.getTransaction(result2.txInfo.id);

      expect(tx1.id).not.toBe(tx2.id);
    });

    test('should store transaction in transactions map', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const result = await manager.executeTransaction(transaction);

      const storedTx = manager.getTransaction(result.txInfo.id);
      expect(storedTx).toBeDefined();
      expect(storedTx.id).toBe(result.txInfo.id);
    });
  });

  describe('Gas Estimation and Optimization', () => {
    test('should estimate gas limit when not provided', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0
      };

      mockProvider.estimateGas.mockResolvedValue(BigInt(50000));

      await manager.executeTransaction(transaction);

      expect(mockProvider.estimateGas).toHaveBeenCalledWith(
        expect.objectContaining({
          to: transaction.to,
          value: transaction.value
        })
      );
    });

    test('should apply gas multiplier to estimated gas', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      mockProvider.estimateGas.mockResolvedValue(BigInt(50000));

      const result = await manager.executeTransaction(transaction);

      // Should apply 1.1x multiplier
      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          gasLimit: BigInt(55000) // 50000 * 1.1
        })
      );
    });

    test('should use default gas limit if estimation fails', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      mockProvider.estimateGas.mockRejectedValue(new Error('Estimation failed'));

      await manager.executeTransaction(transaction);

      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          gasLimit: BigInt(21000) // Default gas limit
        })
      );
    });

    test('should optimize gas with CONSERVATIVE strategy', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      await manager.executeTransaction(transaction, {
        gasStrategy: GAS_STRATEGIES.CONSERVATIVE
      });

      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          maxFeePerGas: BigInt(32) * BigInt(10 ** 9),
          maxPriorityFeePerGas: BigInt(2) * BigInt(10 ** 9)
        })
      );
    });

    test('should optimize gas with MODERATE strategy', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      await manager.executeTransaction(transaction, {
        gasStrategy: GAS_STRATEGIES.MODERATE
      });

      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          maxFeePerGas: BigInt(33) * BigInt(10 ** 9),
          maxPriorityFeePerGas: BigInt(3) * BigInt(10 ** 9)
        })
      );
    });

    test('should optimize gas with AGGRESSIVE strategy', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      await manager.executeTransaction(transaction, {
        gasStrategy: GAS_STRATEGIES.AGGRESSIVE
      });

      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          maxFeePerGas: BigInt(35) * BigInt(10 ** 9),
          maxPriorityFeePerGas: BigInt(5) * BigInt(10 ** 9)
        })
      );
    });

    test('should use custom gas price with CUSTOM strategy', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };
      const customMaxFee = BigInt(50) * BigInt(10 ** 9);
      const customPriorityFee = BigInt(10) * BigInt(10 ** 9);

      await manager.executeTransaction(transaction, {
        gasStrategy: GAS_STRATEGIES.CUSTOM,
        maxFeePerGas: customMaxFee,
        maxPriorityFeePerGas: customPriorityFee
      });

      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          maxFeePerGas: customMaxFee,
          maxPriorityFeePerGas: customPriorityFee
        })
      );
    });

    test('should reject transaction if gas price exceeds maximum', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      manager.gasOracle.getGasPrice.mockResolvedValue({
        fast: {
          maxFeePerGas: BigInt(200) * BigInt(10 ** 9), // Exceeds max of 100 gwei
          maxPriorityFeePerGas: BigInt(3) * BigInt(10 ** 9)
        }
      });

      await expect(
        manager.executeTransaction(transaction, { gasStrategy: GAS_STRATEGIES.MODERATE })
      ).rejects.toThrow('Gas price');
    });
  });

  describe('Transaction Submission', () => {
    test('should submit transaction successfully', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: ethers.parseEther('1.0')
      };

      const result = await manager.executeTransaction(transaction);

      expect(mockSigner.sendTransaction).toHaveBeenCalled();
      expect(result.hash).toBe('0xabcdef1234567890');
      expect(result.nonce).toBe(1);
    });

    test('should update transaction status to SUBMITTED', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const eventSpy = jest.fn();
      manager.on('transactionSubmitted', eventSpy);

      await manager.executeTransaction(transaction);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TRANSACTION_STATUS.SUBMITTED
        })
      );
    });

    test('should increment attempts counter', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const result = await manager.executeTransaction(transaction);
      const txInfo = manager.getTransaction(result.txInfo.id);

      expect(txInfo.attempts).toBe(1);
    });

    test('should handle INSUFFICIENT_FUNDS error', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const error = new Error('Insufficient funds');
      error.code = 'INSUFFICIENT_FUNDS';
      mockSigner.sendTransaction.mockRejectedValue(error);

      await expect(
        manager.executeTransaction(transaction)
      ).rejects.toThrow('Insufficient funds for transaction');
    });

    test('should handle NONCE_EXPIRED error', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const error = new Error('Nonce expired');
      error.code = 'NONCE_EXPIRED';
      mockSigner.sendTransaction.mockRejectedValue(error);

      await expect(
        manager.executeTransaction(transaction)
      ).rejects.toThrow('Transaction nonce expired');
    });

    test('should handle REPLACEMENT_UNDERPRICED error', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const error = new Error('Replacement underpriced');
      error.code = 'REPLACEMENT_UNDERPRICED';
      mockSigner.sendTransaction.mockRejectedValue(error);

      await expect(
        manager.executeTransaction(transaction)
      ).rejects.toThrow('Replacement transaction underpriced');
    });
  });

  describe('Transaction Monitoring and Confirmation', () => {
    test('should wait for transaction confirmation', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const mockWait = jest.fn().mockResolvedValue({
        status: 1,
        gasUsed: BigInt(21000),
        blockNumber: 12345
      });

      mockSigner.sendTransaction.mockResolvedValue({
        hash: '0xabcdef',
        nonce: 1,
        wait: mockWait
      });

      await manager.executeTransaction(transaction);

      expect(mockWait).toHaveBeenCalledWith(2); // confirmationBlocks = 2
    });

    test('should emit transactionConfirmed on success', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const eventSpy = jest.fn();
      manager.on('transactionConfirmed', eventSpy);

      await manager.executeTransaction(transaction);

      // Fast forward to allow monitoring to complete
      await jest.runAllTimersAsync();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TRANSACTION_STATUS.CONFIRMED,
          gasUsed: BigInt(21000)
        })
      );
    });

    test('should emit transactionFailed when receipt status is 0', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      mockSigner.sendTransaction.mockResolvedValue({
        hash: '0xabcdef',
        nonce: 1,
        wait: jest.fn().mockResolvedValue({
          status: 0, // Failed
          gasUsed: BigInt(21000)
        })
      });

      const eventSpy = jest.fn();
      manager.on('transactionFailed', eventSpy);

      await manager.executeTransaction(transaction);
      await jest.runAllTimersAsync();

      expect(eventSpy).toHaveBeenCalled();
    });

    test('should store transaction receipt', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const receipt = {
        status: 1,
        gasUsed: BigInt(21000),
        blockNumber: 12345
      };

      mockSigner.sendTransaction.mockResolvedValue({
        hash: '0xabcdef',
        nonce: 1,
        wait: jest.fn().mockResolvedValue(receipt)
      });

      const result = await manager.executeTransaction(transaction);
      await jest.runAllTimersAsync();

      const txInfo = manager.getTransaction(result.txInfo.id);
      expect(txInfo.receipt).toEqual(receipt);
    });
  });

  describe('Transaction Status Tracking', () => {
    test('should track transaction lifecycle states', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const states = [];
      manager.on('transactionStatusChanged', (tx) => states.push(tx.status));
      manager.on('transactionSubmitted', (tx) => states.push(tx.status));
      manager.on('transactionConfirming', (tx) => states.push(tx.status));
      manager.on('transactionConfirmed', (tx) => states.push(tx.status));

      await manager.executeTransaction(transaction);
      await jest.runAllTimersAsync();

      expect(states).toContain(TRANSACTION_STATUS.QUEUED);
      expect(states).toContain(TRANSACTION_STATUS.SUBMITTED);
      expect(states).toContain(TRANSACTION_STATUS.CONFIRMING);
      expect(states).toContain(TRANSACTION_STATUS.CONFIRMED);
    });

    test('should update timestamp on status change', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const result = await manager.executeTransaction(transaction);
      const txInfo = manager.getTransaction(result.txInfo.id);

      const initialTime = txInfo.updatedAt;

      jest.advanceTimersByTime(1000);
      await jest.runAllTimersAsync();

      const updatedTxInfo = manager.getTransaction(result.txInfo.id);
      expect(updatedTxInfo.updatedAt).toBeGreaterThan(initialTime);
    });
  });

  describe('Transaction History and Querying', () => {
    test('should retrieve transaction by ID', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const result = await manager.executeTransaction(transaction);
      const retrieved = manager.getTransaction(result.txInfo.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(result.txInfo.id);
    });

    test('should get all transactions', async () => {
      const tx1 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };
      const tx2 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEc', value: 0 };

      await manager.executeTransaction(tx1);
      await manager.executeTransaction(tx2);

      const allTransactions = manager.getAllTransactions();
      expect(allTransactions.length).toBeGreaterThanOrEqual(2);
    });

    test('should get pending transactions', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      // Create transaction but don't let it confirm
      mockSigner.sendTransaction.mockResolvedValue({
        hash: '0xabcdef',
        nonce: 1,
        wait: jest.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
      });

      await manager.executeTransaction(transaction);

      const pendingTxs = manager.getPendingTransactions();
      expect(pendingTxs.length).toBeGreaterThan(0);
      expect(pendingTxs[0].status).toBe(TRANSACTION_STATUS.CONFIRMING);
    });
  });

  describe('Pending Transactions Queue', () => {
    test('should maintain queue of pending transactions', async () => {
      mockSigner.sendTransaction.mockResolvedValue({
        hash: '0xabcdef',
        nonce: 1,
        wait: jest.fn().mockImplementation(() => new Promise(() => {}))
      });

      await manager.executeTransaction({ to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 });
      await manager.executeTransaction({ to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEc', value: 0 });

      const pending = manager.getPendingTransactions();
      expect(pending.length).toBe(2);
    });

    test('should filter out confirmed transactions from pending', async () => {
      const result = await manager.executeTransaction({
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0
      });

      await jest.runAllTimersAsync();

      const pending = manager.getPendingTransactions();
      const confirmedTx = pending.find(tx => tx.id === result.txInfo.id);
      expect(confirmedTx).toBeUndefined();
    });
  });

  describe('Transaction Retry Logic', () => {
    test('should retry transaction on timeout', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const timeoutError = new Error('Timeout');
      timeoutError.code = 'TIMEOUT';

      let callCount = 0;
      mockSigner.sendTransaction.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            hash: '0xfirst',
            nonce: 1,
            wait: jest.fn().mockRejectedValue(timeoutError)
          });
        }
        return Promise.resolve({
          hash: '0xsecond',
          nonce: 1,
          wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
        });
      });

      const result = await manager.executeTransaction(transaction);
      await jest.runAllTimersAsync();
      await jest.advanceTimersByTime(5000); // Retry delay
      await jest.runAllTimersAsync();

      const txInfo = manager.getTransaction(result.txInfo.id);
      expect(txInfo.attempts).toBeGreaterThan(1);
    });

    test('should increase gas price on retry', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        maxFeePerGas: BigInt(30) * BigInt(10 ** 9)
      };

      const txInfo = {
        id: 'test-tx',
        originalTransaction: transaction,
        attempts: 1,
        nonce: 1,
        status: TRANSACTION_STATUS.CONFIRMING
      };

      await manager.retryTransaction(txInfo);

      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          maxFeePerGas: expect.any(BigInt)
        })
      );

      const callArg = mockSigner.sendTransaction.mock.calls[0][0];
      expect(Number(callArg.maxFeePerGas)).toBeGreaterThan(Number(transaction.maxFeePerGas));
    });

    test('should fail after maximum retries', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      mockProvider.getTransactionCount.mockResolvedValue(1); // Nonce still pending

      const txInfo = {
        id: 'test-tx',
        originalTransaction: transaction,
        attempts: 3, // At max retries
        nonce: 2,
        status: TRANSACTION_STATUS.CONFIRMING,
        updatedAt: Date.now()
      };

      manager.transactions.set('test-tx', txInfo);

      const eventSpy = jest.fn();
      manager.on('transactionFailed', eventSpy);

      await manager.handleTransactionTimeout(txInfo);

      expect(txInfo.status).toBe(TRANSACTION_STATUS.FAILED);
      expect(txInfo.error).toContain('maximum retries');
    });
  });

  describe('Failed Transaction Handling', () => {
    test('should mark transaction as failed on submission error', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      mockSigner.sendTransaction.mockRejectedValue(new Error('Network error'));

      const eventSpy = jest.fn();
      manager.on('transactionFailed', eventSpy);

      await expect(manager.executeTransaction(transaction)).rejects.toThrow();
      expect(eventSpy).toHaveBeenCalled();
    });

    test('should store error message in transaction info', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const errorMsg = 'Custom network error';
      mockSigner.sendTransaction.mockRejectedValue(new Error(errorMsg));

      try {
        await manager.executeTransaction(transaction);
      } catch (error) {
        // Expected to throw
      }

      const allTxs = manager.getAllTransactions();
      const failedTx = allTxs.find(tx => tx.status === TRANSACTION_STATUS.FAILED);
      expect(failedTx).toBeDefined();
      expect(failedTx.error).toContain(errorMsg);
    });
  });

  describe('Transaction Receipts', () => {
    test('should store complete receipt data', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const mockReceipt = {
        status: 1,
        gasUsed: BigInt(21000),
        blockNumber: 12345,
        blockHash: '0xblockhash',
        transactionHash: '0xtxhash',
        logs: []
      };

      mockSigner.sendTransaction.mockResolvedValue({
        hash: '0xabcdef',
        nonce: 1,
        wait: jest.fn().mockResolvedValue(mockReceipt)
      });

      const result = await manager.executeTransaction(transaction);
      await jest.runAllTimersAsync();

      const txInfo = manager.getTransaction(result.txInfo.id);
      expect(txInfo.receipt).toEqual(mockReceipt);
    });

    test('should extract gas used from receipt', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      mockSigner.sendTransaction.mockResolvedValue({
        hash: '0xabcdef',
        nonce: 1,
        wait: jest.fn().mockResolvedValue({
          status: 1,
          gasUsed: BigInt(45000)
        })
      });

      const result = await manager.executeTransaction(transaction);
      await jest.runAllTimersAsync();

      const txInfo = manager.getTransaction(result.txInfo.id);
      expect(txInfo.gasUsed).toBe(BigInt(45000));
    });
  });

  describe('Event Emission', () => {
    test('should emit transactionCreated event', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const eventSpy = jest.fn();
      manager.on('transactionCreated', eventSpy);

      await manager.executeTransaction(transaction);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TRANSACTION_STATUS.PENDING
        })
      );
    });

    test('should support multiple listeners for same event', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const listener1 = jest.fn();
      const listener2 = jest.fn();

      manager.on('transactionCreated', listener1);
      manager.on('transactionCreated', listener2);

      await manager.executeTransaction(transaction);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    test('should remove event listener with off()', () => {
      const listener = jest.fn();

      manager.on('transactionCreated', listener);
      manager.off('transactionCreated', listener);

      manager.emit('transactionCreated', {});

      expect(listener).not.toHaveBeenCalled();
    });

    test('should handle errors in event listeners gracefully', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const badListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      manager.on('transactionCreated', badListener);
      manager.on('transactionCreated', goodListener);

      // Should not throw
      await expect(manager.executeTransaction(transaction)).resolves.toBeDefined();

      expect(badListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('Multiple Concurrent Transactions', () => {
    test('should handle multiple concurrent transactions', async () => {
      const tx1 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };
      const tx2 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEc', value: 0 };
      const tx3 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd', value: 0 };

      const results = await Promise.all([
        manager.executeTransaction(tx1),
        manager.executeTransaction(tx2),
        manager.executeTransaction(tx3)
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].hash).toBeDefined();
      expect(results[1].hash).toBeDefined();
      expect(results[2].hash).toBeDefined();
    });

    test('should track each concurrent transaction independently', async () => {
      mockSigner.sendTransaction
        .mockResolvedValueOnce({
          hash: '0xhash1',
          nonce: 1,
          wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
        })
        .mockResolvedValueOnce({
          hash: '0xhash2',
          nonce: 2,
          wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(22000) })
        });

      const [result1, result2] = await Promise.all([
        manager.executeTransaction({ to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 }),
        manager.executeTransaction({ to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEc', value: 0 })
      ]);

      expect(result1.hash).toBe('0xhash1');
      expect(result2.hash).toBe('0xhash2');
    });
  });

  describe('Transaction Cancellation', () => {
    test('should cancel pending transaction', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        maxFeePerGas: BigInt(30) * BigInt(10 ** 9),
        maxPriorityFeePerGas: BigInt(2) * BigInt(10 ** 9)
      };

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xoriginal',
        nonce: 5,
        wait: jest.fn().mockImplementation(() => new Promise(() => {}))
      });

      const result = await manager.executeTransaction(transaction);

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xcancellation',
        nonce: 5,
        wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
      });

      const cancelResult = await manager.cancelTransaction(result.txInfo.id);

      expect(cancelResult.hash).toBe('0xcancellation');

      const txInfo = manager.getTransaction(result.txInfo.id);
      expect(txInfo.status).toBe(TRANSACTION_STATUS.CANCELLED);
      expect(txInfo.cancellationHash).toBe('0xcancellation');
    });

    test('should reject cancellation of already confirmed transaction', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      const result = await manager.executeTransaction(transaction);
      await jest.runAllTimersAsync();

      // Transaction should be confirmed
      await expect(
        manager.cancelTransaction(result.txInfo.id)
      ).rejects.toThrow('cannot be cancelled');
    });

    test('should send cancellation with higher gas price', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        maxFeePerGas: BigInt(30) * BigInt(10 ** 9),
        maxPriorityFeePerGas: BigInt(2) * BigInt(10 ** 9)
      };

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xoriginal',
        nonce: 5,
        wait: jest.fn().mockImplementation(() => new Promise(() => {}))
      });

      const result = await manager.executeTransaction(transaction);

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xcancellation',
        nonce: 5,
        wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
      });

      await manager.cancelTransaction(result.txInfo.id);

      const cancelTxCall = mockSigner.sendTransaction.mock.calls[1][0];
      expect(Number(cancelTxCall.maxFeePerGas)).toBeGreaterThan(Number(transaction.maxFeePerGas));
    });

    test('should emit transactionCancelled event', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        maxFeePerGas: BigInt(30) * BigInt(10 ** 9)
      };

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xoriginal',
        nonce: 5,
        wait: jest.fn().mockImplementation(() => new Promise(() => {}))
      });

      const result = await manager.executeTransaction(transaction);

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xcancellation',
        nonce: 5,
        wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
      });

      const eventSpy = jest.fn();
      manager.on('transactionCancelled', eventSpy);

      await manager.cancelTransaction(result.txInfo.id);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TRANSACTION_STATUS.CANCELLED
        })
      );
    });
  });

  describe('Transaction Speed Up', () => {
    test('should speed up pending transaction', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        maxFeePerGas: BigInt(30) * BigInt(10 ** 9),
        maxPriorityFeePerGas: BigInt(2) * BigInt(10 ** 9)
      };

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xoriginal',
        nonce: 5,
        wait: jest.fn().mockImplementation(() => new Promise(() => {}))
      });

      const result = await manager.executeTransaction(transaction);

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xspeedup',
        nonce: 5,
        wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
      });

      const speedUpResult = await manager.speedUpTransaction(result.txInfo.id, 1.5);

      expect(speedUpResult.hash).toBe('0xspeedup');
    });

    test('should apply custom gas multiplier', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        maxFeePerGas: BigInt(30) * BigInt(10 ** 9)
      };

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xoriginal',
        nonce: 5,
        wait: jest.fn().mockImplementation(() => new Promise(() => {}))
      });

      const result = await manager.executeTransaction(transaction);

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xspeedup',
        nonce: 5,
        wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
      });

      await manager.speedUpTransaction(result.txInfo.id, 1.5);

      const speedUpCall = mockSigner.sendTransaction.mock.calls[1][0];
      expect(Number(speedUpCall.maxFeePerGas)).toBe(Number(BigInt(30) * BigInt(10 ** 9) * BigInt(1.5) / BigInt(1)));
    });

    test('should track speed up hashes', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        maxFeePerGas: BigInt(30) * BigInt(10 ** 9)
      };

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xoriginal',
        nonce: 5,
        wait: jest.fn().mockImplementation(() => new Promise(() => {}))
      });

      const result = await manager.executeTransaction(transaction);

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xspeedup1',
        nonce: 5,
        wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
      });

      await manager.speedUpTransaction(result.txInfo.id);

      const txInfo = manager.getTransaction(result.txInfo.id);
      expect(txInfo.speedUpHashes).toContain('0xspeedup1');
    });

    test('should emit transactionSpedUp event', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        maxFeePerGas: BigInt(30) * BigInt(10 ** 9)
      };

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xoriginal',
        nonce: 5,
        wait: jest.fn().mockImplementation(() => new Promise(() => {}))
      });

      const result = await manager.executeTransaction(transaction);

      mockSigner.sendTransaction.mockResolvedValueOnce({
        hash: '0xspeedup',
        nonce: 5,
        wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
      });

      const eventSpy = jest.fn();
      manager.on('transactionSpedUp', eventSpy);

      await manager.speedUpTransaction(result.txInfo.id);

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('Security Checks', () => {
    test('should verify contract exists at address', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        data: '0x123'
      };

      mockProvider.getCode.mockResolvedValue('0x6080604052...');

      await manager.executeTransaction(transaction);

      expect(mockProvider.getCode).toHaveBeenCalledWith(transaction.to);
    });

    test('should detect non-contract addresses', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        data: '0x123'
      };

      mockProvider.getCode.mockResolvedValue('0x');

      // Should not throw, just log warning
      await expect(manager.executeTransaction(transaction)).resolves.toBeDefined();
    });

    test('should require confirmation for high value transactions', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: ethers.parseEther('15') // > 10 ETH
      };

      await expect(
        manager.executeTransaction(transaction)
      ).rejects.toThrow('High value transaction requires explicit confirmation');
    });

    test('should allow high value with confirmation flag', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: ethers.parseEther('15')
      };

      await expect(
        manager.executeTransaction(transaction, { highValueConfirmed: true })
      ).resolves.toBeDefined();
    });

    test('should simulate transaction before submission', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        data: '0x123'
      };

      await manager.executeTransaction(transaction);

      expect(mockProvider.call).toHaveBeenCalledWith(
        expect.objectContaining({
          to: transaction.to,
          data: transaction.data
        })
      );
    });

    test('should fail if simulation fails', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        data: '0x123'
      };

      mockProvider.call.mockRejectedValue(new Error('Execution reverted'));

      await expect(
        manager.executeTransaction(transaction)
      ).rejects.toThrow('Transaction simulation failed');
    });

    test('should skip simulation if disabled', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0,
        data: '0x123'
      };

      mockProvider.call.mockClear();

      await manager.executeTransaction(transaction, { simulate: false });

      expect(mockProvider.call).not.toHaveBeenCalled();
    });

    test('should apply MEV protection by default', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0
      };

      const startTime = Date.now();

      // Mock setTimeout to track delays
      const delays = [];
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn, delay) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0);
      });

      await manager.executeTransaction(transaction);

      // Should have added random delay (between 1000-3000ms)
      const mevDelay = delays.find(d => d >= 1000 && d <= 3000);
      expect(mevDelay).toBeDefined();

      global.setTimeout = originalSetTimeout;
    });

    test('should skip MEV protection if disabled', async () => {
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: 0
      };

      const delays = [];
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn, delay) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0);
      });

      await manager.executeTransaction(transaction, { mevProtection: false });

      // Should not have MEV delay
      const mevDelay = delays.find(d => d >= 1000 && d <= 3000);
      expect(mevDelay).toBeUndefined();

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Batch Transactions', () => {
    test('should create a batch', async () => {
      const batch = await manager.createBatch('batch-1', BATCH_TYPES.SEQUENCE);

      expect(batch.id).toBe('batch-1');
      expect(batch.type).toBe(BATCH_TYPES.SEQUENCE);
      expect(batch.transactions).toEqual([]);
      expect(batch.status).toBe('created');
    });

    test('should add transaction to batch', async () => {
      await manager.createBatch('batch-1', BATCH_TYPES.SEQUENCE);

      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      await manager.executeTransaction(transaction, { batch: 'batch-1' });

      const batch = manager.getBatch('batch-1');
      expect(batch.transactions.length).toBe(1);
    });

    test('should execute sequence batch in order', async () => {
      await manager.createBatch('batch-1', BATCH_TYPES.SEQUENCE);

      const tx1 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };
      const tx2 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEc', value: 0 };

      await manager.executeTransaction(tx1, { batch: 'batch-1' });
      await manager.executeTransaction(tx2, { batch: 'batch-1' });

      const results = await manager.executeBatch('batch-1');

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    test('should execute parallel batch concurrently', async () => {
      await manager.createBatch('batch-1', BATCH_TYPES.PARALLEL);

      const tx1 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };
      const tx2 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEc', value: 0 };

      await manager.executeTransaction(tx1, { batch: 'batch-1' });
      await manager.executeTransaction(tx2, { batch: 'batch-1' });

      const results = await manager.executeBatch('batch-1');

      expect(results).toHaveLength(2);
    });

    test('should emit batch events', async () => {
      const createdSpy = jest.fn();
      const executingSpy = jest.fn();
      const completedSpy = jest.fn();

      manager.on('batchCreated', createdSpy);
      manager.on('batchExecuting', executingSpy);
      manager.on('batchCompleted', completedSpy);

      await manager.createBatch('batch-1', BATCH_TYPES.SEQUENCE);
      await manager.executeTransaction(
        { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 },
        { batch: 'batch-1' }
      );
      await manager.executeBatch('batch-1');

      expect(createdSpy).toHaveBeenCalled();
      expect(executingSpy).toHaveBeenCalled();
      expect(completedSpy).toHaveBeenCalled();
    });

    test('should stop sequence batch on failure if configured', async () => {
      await manager.createBatch('batch-1', BATCH_TYPES.SEQUENCE, { stopOnFailure: true });

      mockSigner.sendTransaction
        .mockResolvedValueOnce({
          hash: '0xfirst',
          nonce: 1,
          wait: jest.fn().mockResolvedValue({ status: 1, gasUsed: BigInt(21000) })
        })
        .mockRejectedValueOnce(new Error('Failed'));

      const tx1 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };
      const tx2 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEc', value: 0 };
      const tx3 = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd', value: 0 };

      await manager.executeTransaction(tx1, { batch: 'batch-1' });
      await manager.executeTransaction(tx2, { batch: 'batch-1' });
      await manager.executeTransaction(tx3, { batch: 'batch-1' });

      const results = await manager.executeBatch('batch-1');

      // Should stop after second transaction fails
      expect(results.length).toBeLessThan(3);
    });

    test('should get all batches', async () => {
      await manager.createBatch('batch-1', BATCH_TYPES.SEQUENCE);
      await manager.createBatch('batch-2', BATCH_TYPES.PARALLEL);

      const batches = manager.getAllBatches();
      expect(batches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Utility Functions', () => {
    test('formatGasPrice should format correctly', () => {
      const gasPrice = BigInt(30) * BigInt(10 ** 9); // 30 gwei
      const formatted = formatGasPrice(gasPrice);

      expect(formatted).toContain('30');
      expect(formatted).toContain('gwei');
    });

    test('estimateTransactionCost should calculate correctly', () => {
      const gasLimit = BigInt(21000);
      const gasPrice = BigInt(30) * BigInt(10 ** 9); // 30 gwei

      const cost = estimateTransactionCost(gasLimit, gasPrice);

      expect(cost).toBe(gasLimit * gasPrice);
    });
  });

  describe('Transaction Cleanup', () => {
    test('should cleanup old completed transactions', () => {
      const oldTx = {
        id: 'old-tx',
        status: TRANSACTION_STATUS.CONFIRMED,
        createdAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        updatedAt: Date.now()
      };

      manager.transactions.set('old-tx', oldTx);

      manager.cleanupOldTransactions();

      expect(manager.getTransaction('old-tx')).toBeUndefined();
    });

    test('should keep recent transactions', () => {
      const recentTx = {
        id: 'recent-tx',
        status: TRANSACTION_STATUS.CONFIRMED,
        createdAt: Date.now() - (1 * 60 * 60 * 1000), // 1 hour ago
        updatedAt: Date.now()
      };

      manager.transactions.set('recent-tx', recentTx);

      manager.cleanupOldTransactions();

      expect(manager.getTransaction('recent-tx')).toBeDefined();
    });

    test('should keep pending transactions regardless of age', () => {
      const oldPendingTx = {
        id: 'old-pending',
        status: TRANSACTION_STATUS.CONFIRMING,
        createdAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        updatedAt: Date.now()
      };

      manager.transactions.set('old-pending', oldPendingTx);

      manager.cleanupOldTransactions();

      expect(manager.getTransaction('old-pending')).toBeDefined();
    });
  });

  describe('Pending Transaction Monitoring', () => {
    test('should check for timed out transactions', async () => {
      const timedOutTx = {
        id: 'timeout-tx',
        status: TRANSACTION_STATUS.CONFIRMING,
        nonce: 5,
        updatedAt: Date.now() - (6 * 60 * 1000), // 6 minutes ago
        attempts: 0,
        originalTransaction: { maxFeePerGas: BigInt(30) * BigInt(10 ** 9) }
      };

      manager.transactions.set('timeout-tx', timedOutTx);

      const handleTimeoutSpy = jest.spyOn(manager, 'handleTransactionTimeout');

      manager.checkPendingTransactions();

      expect(handleTimeoutSpy).toHaveBeenCalledWith(timedOutTx);
    });

    test('should not check transactions under timeout threshold', () => {
      const recentTx = {
        id: 'recent-tx',
        status: TRANSACTION_STATUS.CONFIRMING,
        updatedAt: Date.now() - (2 * 60 * 1000) // 2 minutes ago
      };

      manager.transactions.set('recent-tx', recentTx);

      const handleTimeoutSpy = jest.spyOn(manager, 'handleTransactionTimeout');

      manager.checkPendingTransactions();

      expect(handleTimeoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      mockSigner.sendTransaction.mockRejectedValue(new Error('Network request failed'));

      await expect(
        manager.executeTransaction(transaction)
      ).rejects.toThrow();

      const allTxs = manager.getAllTransactions();
      const failedTx = allTxs[allTxs.length - 1];
      expect(failedTx.status).toBe(TRANSACTION_STATUS.FAILED);
    });

    test('should handle gas estimation failures', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      mockProvider.estimateGas.mockRejectedValue(new Error('Always failing'));

      // Should not throw, should use default gas
      await expect(
        manager.executeTransaction(transaction)
      ).resolves.toBeDefined();
    });

    test('should handle missing transaction in cancelTransaction', async () => {
      await expect(
        manager.cancelTransaction('non-existent-id')
      ).rejects.toThrow('Transaction not found');
    });

    test('should handle missing transaction in speedUpTransaction', async () => {
      await expect(
        manager.speedUpTransaction('non-existent-id')
      ).rejects.toThrow('Transaction not found');
    });

    test('should handle missing batch in addToBatch', async () => {
      const transaction = { to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: 0 };

      await expect(
        manager.executeTransaction(transaction, { batch: 'non-existent-batch' })
      ).rejects.toThrow('Batch');
    });

    test('should handle missing batch in executeBatch', async () => {
      await expect(
        manager.executeBatch('non-existent-batch')
      ).rejects.toThrow('Batch');
    });
  });

  describe('Transaction Replacement Detection', () => {
    test('should detect replaced transaction', async () => {
      const txInfo = {
        id: 'test-tx',
        nonce: 5,
        status: TRANSACTION_STATUS.CONFIRMING,
        updatedAt: Date.now(),
        attempts: 1,
        originalTransaction: {}
      };

      manager.transactions.set('test-tx', txInfo);

      // Nonce has moved past this transaction
      mockProvider.getTransactionCount.mockResolvedValue(10);

      const eventSpy = jest.fn();
      manager.on('transactionReplaced', eventSpy);

      await manager.handleTransactionTimeout(txInfo);

      expect(txInfo.status).toBe(TRANSACTION_STATUS.REPLACED);
      expect(eventSpy).toHaveBeenCalled();
    });
  });
});

describe('GasOracle', () => {
  let mockProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider = require('./WalletManager.js').walletManager.provider;

    mockProvider.getBlock.mockResolvedValue({
      baseFeePerGas: BigInt(30) * BigInt(10 ** 9)
    });
  });

  test('should calculate gas prices for all priority levels', async () => {
    const { GasOracle } = await import('./TransactionManager.js');
    const oracle = new (class extends GasOracle {})();

    await oracle.updateGasData();

    expect(oracle.gasData.slow).toBeDefined();
    expect(oracle.gasData.standard).toBeDefined();
    expect(oracle.gasData.fast).toBeDefined();
    expect(oracle.gasData.instant).toBeDefined();
  });

  test('should include base fee in calculations', async () => {
    const { GasOracle } = await import('./TransactionManager.js');
    const oracle = new (class extends GasOracle {})();

    await oracle.updateGasData();

    expect(oracle.gasData.baseFee).toBe(BigInt(30) * BigInt(10 ** 9));
  });

  test('should handle provider errors gracefully', async () => {
    mockProvider.getBlock.mockRejectedValue(new Error('Provider error'));

    const { GasOracle } = await import('./TransactionManager.js');
    const oracle = new (class extends GasOracle {})();

    // Should not throw
    await expect(oracle.updateGasData()).resolves.toBeUndefined();
  });
});

describe('BatchExecutor', () => {
  let executor;
  let mockManager;

  beforeEach(() => {
    jest.clearAllMocks();

    const { BatchExecutor } = require('./TransactionManager.js');
    executor = new BatchExecutor();

    mockManager = {
      optimizeGasSettings: jest.fn().mockResolvedValue({}),
      submitTransaction: jest.fn().mockResolvedValue({ hash: '0xtest' })
    };
  });

  test('should execute multicall batch', async () => {
    const batch = {
      transactions: [
        { id: 'tx1', originalTransaction: {}, options: {} },
        { id: 'tx2', originalTransaction: {}, options: {} }
      ]
    };

    const results = await executor.executeMulticall(batch);

    expect(results).toHaveLength(2);
  });

  test('should execute sequence batch', async () => {
    const batch = {
      transactions: [
        { id: 'tx1', originalTransaction: {}, options: {} },
        { id: 'tx2', originalTransaction: {}, options: {} }
      ],
      options: {}
    };

    const results = await executor.executeSequence(batch);

    expect(results).toHaveLength(2);
  });

  test('should execute parallel batch', async () => {
    const batch = {
      transactions: [
        { id: 'tx1', originalTransaction: {}, options: {} },
        { id: 'tx2', originalTransaction: {}, options: {} }
      ]
    };

    const results = await executor.executeParallel(batch);

    expect(results).toHaveLength(2);
  });
});
