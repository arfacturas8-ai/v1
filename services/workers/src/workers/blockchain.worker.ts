import { Logger } from 'pino';
import { Job } from 'bullmq';
import { ethers } from 'ethers';

export interface BlockchainJobData {
  type: 'transaction' | 'token-transfer' | 'nft-mint' | 'smart-contract' | 'balance-check' | 'gas-estimation' | 'wallet-creation' | 'token-validation' | 'price-fetch';
  data: {
    network?: 'ethereum' | 'polygon' | 'bsc' | 'avalanche' | 'arbitrum' | 'optimism';
    transaction?: {
      from: string;
      to: string;
      amount: string;
      tokenAddress?: string;
      gasPrice?: string;
      gasLimit?: string;
      data?: string;
    };
    nft?: {
      contractAddress: string;
      tokenId?: string;
      recipient?: string;
      metadata?: Record<string, any>;
    };
    contract?: {
      address: string;
      abi?: any[];
      functionName?: string;
      parameters?: any[];
    };
    wallet?: {
      mnemonic?: string;
      privateKey?: string;
      address?: string;
    };
    token?: {
      address: string;
      symbol?: string;
      decimals?: number;
    };
  };
  options?: {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    timeout?: number;
    retries?: number;
    gasOptimization?: boolean;
    simulateFirst?: boolean;
  };
  metadata?: {
    userId?: string;
    orderId?: string;
    requestId?: string;
    source?: 'web' | 'mobile' | 'api';
  };
}

export interface BlockchainResult {
  id: string;
  type: string;
  status: 'pending' | 'confirmed' | 'failed' | 'reverted';
  timestamp: Date;
  processingTime: number;
  network: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  gasPaid?: string;
  result?: any;
  error?: string;
  receipt?: any;
}

export class BlockchainWorker {
  private providers: Record<string, ethers.JsonRpcProvider> = {};
  private isInitialized = false;
  private transactionStats = {
    transaction: { processed: 0, confirmed: 0, failed: 0, totalGasUsed: 0 },
    tokenTransfer: { processed: 0, confirmed: 0, failed: 0, totalGasUsed: 0 },
    nftMint: { processed: 0, confirmed: 0, failed: 0, totalGasUsed: 0 },
    smartContract: { processed: 0, confirmed: 0, failed: 0, totalGasUsed: 0 },
    balanceCheck: { processed: 0, confirmed: 0, failed: 0, totalGasUsed: 0 },
    gasEstimation: { processed: 0, confirmed: 0, failed: 0, totalGasUsed: 0 },
    walletCreation: { processed: 0, confirmed: 0, failed: 0, totalGasUsed: 0 },
    tokenValidation: { processed: 0, confirmed: 0, failed: 0, totalGasUsed: 0 },
    priceFetch: { processed: 0, confirmed: 0, failed: 0, totalGasUsed: 0 }
  };

  constructor(
    private logger: Logger,
    private config: {
      networks: {
        ethereum?: { rpcUrl: string; chainId: number };
        polygon?: { rpcUrl: string; chainId: number };
        bsc?: { rpcUrl: string; chainId: number };
        avalanche?: { rpcUrl: string; chainId: number };
        arbitrum?: { rpcUrl: string; chainId: number };
        optimism?: { rpcUrl: string; chainId: number };
      };
      wallet?: {
        privateKey: string;
        mnemonic?: string;
      };
      contracts?: {
        erc20Abi?: any[];
        erc721Abi?: any[];
        customContracts?: Record<string, { address: string; abi: any[] }>;
      };
      apis?: {
        coinGeckoApiKey?: string;
        moralisApiKey?: string;
        alchemyApiKey?: string;
      };
      settings?: {
        defaultGasMultiplier: number;
        maxGasPrice: string;
        transactionTimeout: number;
        confirmations: number;
      };
    }
  ) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing blockchain worker', {
        networks: Object.keys(this.config.networks),
        hasWallet: !!this.config.wallet?.privateKey,
        hasContracts: !!this.config.contracts,
        hasApis: !!this.config.apis
      });

      // Initialize providers for each network
      for (const [networkName, networkConfig] of Object.entries(this.config.networks)) {
        if (networkConfig.rpcUrl) {
          this.providers[networkName] = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
          this.logger.info(`Initialized provider for ${networkName}`, {
            chainId: networkConfig.chainId
          });
        }
      }

      // Test connectivity
      await this.testConnectivity();

      this.isInitialized = true;
      this.logger.info('Blockchain worker initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize blockchain worker:', error);
      throw error;
    }
  }

  private async testConnectivity(): Promise<void> {
    const connectivityTests = Object.entries(this.providers).map(async ([network, provider]) => {
      try {
        const blockNumber = await provider.getBlockNumber();
        this.logger.info(`${network} connectivity test passed`, { blockNumber });
        return { network, success: true, blockNumber };
      } catch (error) {
        this.logger.error(`${network} connectivity test failed:`, error);
        return { network, success: false, error };
      }
    });

    const results = await Promise.allSettled(connectivityTests);
    const failedTests = results.filter(result => result.status === 'rejected');
    
    if (failedTests.length > 0) {
      this.logger.warn(`${failedTests.length} connectivity tests failed`);
    }
  }

  async processJob(job: Job<BlockchainJobData>): Promise<BlockchainResult> {
    if (!this.isInitialized) {
      throw new Error('Blockchain worker not initialized');
    }

    const jobId = job.id || 'unknown';
    const startTime = Date.now();

    try {
      this.logger.info(`Processing blockchain job ${jobId}`, {
        type: job.data.type,
        network: job.data.data.network,
        priority: job.data.options?.priority,
        attempts: job.attemptsMade || 0
      });

      await job.updateProgress(10);

      const network = job.data.data.network || 'ethereum';
      const provider = this.providers[network];
      
      if (!provider) {
        throw new Error(`Provider not configured for network: ${network}`);
      }

      let result: BlockchainResult;

      switch (job.data.type) {
        case 'transaction':
          result = await this.processTransaction(job.data, jobId, job, provider);
          break;
        case 'token-transfer':
          result = await this.processTokenTransfer(job.data, jobId, job, provider);
          break;
        case 'nft-mint':
          result = await this.processNftMint(job.data, jobId, job, provider);
          break;
        case 'smart-contract':
          result = await this.processSmartContract(job.data, jobId, job, provider);
          break;
        case 'balance-check':
          result = await this.processBalanceCheck(job.data, jobId, job, provider);
          break;
        case 'gas-estimation':
          result = await this.processGasEstimation(job.data, jobId, job, provider);
          break;
        case 'wallet-creation':
          result = await this.processWalletCreation(job.data, jobId, job);
          break;
        case 'token-validation':
          result = await this.processTokenValidation(job.data, jobId, job, provider);
          break;
        case 'price-fetch':
          result = await this.processPriceFetch(job.data, jobId, job);
          break;
        default:
          throw new Error(`Unsupported blockchain job type: ${job.data.type}`);
      }

      // Update statistics
      const statsKey = this.getStatsKey(job.data.type);
      if (statsKey && this.transactionStats[statsKey]) {
        this.transactionStats[statsKey].processed++;
        if (result.status === 'confirmed') {
          this.transactionStats[statsKey].confirmed++;
        } else if (result.status === 'failed') {
          this.transactionStats[statsKey].failed++;
        }
        if (result.gasUsed) {
          this.transactionStats[statsKey].totalGasUsed += result.gasUsed;
        }
      }

      await job.updateProgress(100);

      const processingTime = Date.now() - startTime;
      this.logger.info(`Blockchain job processed successfully ${jobId}`, {
        type: job.data.type,
        status: result.status,
        transactionHash: result.transactionHash,
        processingTime
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const result: BlockchainResult = {
        id: jobId,
        type: job.data.type,
        status: 'failed',
        timestamp: new Date(),
        processingTime,
        network: job.data.data.network || 'ethereum',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Update failure statistics
      const statsKey = this.getStatsKey(job.data.type);
      if (statsKey && this.transactionStats[statsKey]) {
        this.transactionStats[statsKey].failed++;
      }

      this.logger.error(`Blockchain job processing failed ${jobId}:`, {
        type: job.data.type,
        network: job.data.data.network,
        error: error instanceof Error ? error.message : error,
        processingTime
      });

      throw error;
    }
  }

  private async processTransaction(
    data: BlockchainJobData,
    jobId: string,
    job: Job,
    provider: ethers.JsonRpcProvider
  ): Promise<BlockchainResult> {
    const transaction = data.data.transaction!;
    
    await job.updateProgress(20);

    if (!this.config.wallet?.privateKey) {
      throw new Error('Wallet private key not configured');
    }

    const wallet = new ethers.Wallet(this.config.wallet.privateKey, provider);

    await job.updateProgress(40);

    // Prepare transaction
    const tx = {
      to: transaction.to,
      value: ethers.parseEther(transaction.amount),
      gasPrice: transaction.gasPrice ? ethers.parseUnits(transaction.gasPrice, 'gwei') : undefined,
      gasLimit: transaction.gasLimit ? parseInt(transaction.gasLimit) : undefined,
      data: transaction.data || '0x'
    };

    // Estimate gas if not provided
    if (!tx.gasLimit) {
      tx.gasLimit = await provider.estimateGas(tx);
    }

    await job.updateProgress(60);

    // Send transaction
    const txResponse = await wallet.sendTransaction(tx);

    await job.updateProgress(80);

    // Wait for confirmation
    const receipt = await txResponse.wait(this.config.settings?.confirmations || 1);

    return {
      id: jobId,
      type: 'transaction',
      status: receipt?.status === 1 ? 'confirmed' : 'failed',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      network: data.data.network || 'ethereum',
      transactionHash: txResponse.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed ? Number(receipt.gasUsed) : undefined,
      gasPaid: receipt?.gasUsed && receipt?.gasPrice 
        ? ethers.formatEther(receipt.gasUsed * receipt.gasPrice)
        : undefined,
      receipt
    };
  }

  private async processTokenTransfer(
    data: BlockchainJobData,
    jobId: string,
    job: Job,
    provider: ethers.JsonRpcProvider
  ): Promise<BlockchainResult> {
    const transaction = data.data.transaction!;
    
    await job.updateProgress(20);

    if (!this.config.wallet?.privateKey) {
      throw new Error('Wallet private key not configured');
    }

    if (!transaction.tokenAddress) {
      throw new Error('Token address required for token transfer');
    }

    const wallet = new ethers.Wallet(this.config.wallet.privateKey, provider);

    // ERC-20 ABI (basic transfer function)
    const erc20Abi = this.config.contracts?.erc20Abi || [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];

    const tokenContract = new ethers.Contract(transaction.tokenAddress, erc20Abi, wallet);

    await job.updateProgress(40);

    // Get token decimals
    const decimals = await tokenContract.decimals();
    const amount = ethers.parseUnits(transaction.amount, decimals);

    await job.updateProgress(60);

    // Send token transfer transaction
    const txResponse = await tokenContract.transfer(transaction.to, amount, {
      gasPrice: transaction.gasPrice ? ethers.parseUnits(transaction.gasPrice, 'gwei') : undefined,
      gasLimit: transaction.gasLimit ? parseInt(transaction.gasLimit) : undefined
    });

    await job.updateProgress(80);

    // Wait for confirmation
    const receipt = await txResponse.wait(this.config.settings?.confirmations || 1);

    return {
      id: jobId,
      type: 'token-transfer',
      status: receipt?.status === 1 ? 'confirmed' : 'failed',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      network: data.data.network || 'ethereum',
      transactionHash: txResponse.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed ? Number(receipt.gasUsed) : undefined,
      receipt
    };
  }

  private async processNftMint(
    data: BlockchainJobData,
    jobId: string,
    job: Job,
    provider: ethers.JsonRpcProvider
  ): Promise<BlockchainResult> {
    const nft = data.data.nft!;
    
    await job.updateProgress(30);

    if (!this.config.wallet?.privateKey) {
      throw new Error('Wallet private key not configured');
    }

    const wallet = new ethers.Wallet(this.config.wallet.privateKey, provider);

    // Basic ERC-721 ABI
    const erc721Abi = this.config.contracts?.erc721Abi || [
      'function mint(address to, uint256 tokenId) returns (bool)',
      'function safeMint(address to, string memory uri) returns (bool)',
      'function totalSupply() view returns (uint256)'
    ];

    const nftContract = new ethers.Contract(nft.contractAddress, erc721Abi, wallet);

    await job.updateProgress(60);

    // Mint NFT (this is a simplified example)
    const txResponse = nft.tokenId 
      ? await nftContract.mint(nft.recipient, nft.tokenId)
      : await nftContract.safeMint(nft.recipient, JSON.stringify(nft.metadata));

    await job.updateProgress(80);

    const receipt = await txResponse.wait();

    return {
      id: jobId,
      type: 'nft-mint',
      status: receipt?.status === 1 ? 'confirmed' : 'failed',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      network: data.data.network || 'ethereum',
      transactionHash: txResponse.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed ? Number(receipt.gasUsed) : undefined,
      receipt
    };
  }

  private async processSmartContract(
    data: BlockchainJobData,
    jobId: string,
    job: Job,
    provider: ethers.JsonRpcProvider
  ): Promise<BlockchainResult> {
    const contract = data.data.contract!;
    
    await job.updateProgress(30);

    if (!contract.abi || !contract.functionName) {
      throw new Error('Contract ABI and function name required');
    }

    const contractInstance = new ethers.Contract(contract.address, contract.abi, provider);

    await job.updateProgress(60);

    // Call contract function
    const result = await contractInstance[contract.functionName](...(contract.parameters || []));

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'smart-contract',
      status: 'confirmed',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      network: data.data.network || 'ethereum',
      result
    };
  }

  private async processBalanceCheck(
    data: BlockchainJobData,
    jobId: string,
    job: Job,
    provider: ethers.JsonRpcProvider
  ): Promise<BlockchainResult> {
    const wallet = data.data.wallet!;
    
    await job.updateProgress(30);

    let balance: bigint;
    let result: any;

    if (data.data.token?.address) {
      // ERC-20 token balance
      const tokenContract = new ethers.Contract(
        data.data.token.address,
        ['function balanceOf(address owner) view returns (uint256)', 'function decimals() view returns (uint8)'],
        provider
      );
      
      balance = await tokenContract.balanceOf(wallet.address);
      const decimals = await tokenContract.decimals();
      
      result = {
        balance: ethers.formatUnits(balance, decimals),
        balanceWei: balance.toString(),
        token: data.data.token
      };
    } else {
      // Native ETH balance
      balance = await provider.getBalance(wallet.address);
      result = {
        balance: ethers.formatEther(balance),
        balanceWei: balance.toString()
      };
    }

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'balance-check',
      status: 'confirmed',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      network: data.data.network || 'ethereum',
      result
    };
  }

  private async processGasEstimation(
    data: BlockchainJobData,
    jobId: string,
    job: Job,
    provider: ethers.JsonRpcProvider
  ): Promise<BlockchainResult> {
    const transaction = data.data.transaction!;
    
    await job.updateProgress(40);

    const tx = {
      to: transaction.to,
      value: transaction.amount ? ethers.parseEther(transaction.amount) : 0,
      data: transaction.data || '0x'
    };

    const gasEstimate = await provider.estimateGas(tx);
    const gasPrice = await provider.getFeeData();

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'gas-estimation',
      status: 'confirmed',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      network: data.data.network || 'ethereum',
      result: {
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
        estimatedCost: gasPrice.gasPrice ? ethers.formatEther(gasEstimate * gasPrice.gasPrice) : null
      }
    };
  }

  private async processWalletCreation(
    data: BlockchainJobData,
    jobId: string,
    job: Job
  ): Promise<BlockchainResult> {
    await job.updateProgress(50);

    let wallet: ethers.HDNodeWallet | ethers.Wallet;

    if (data.data.wallet?.mnemonic) {
      wallet = ethers.Wallet.fromPhrase(data.data.wallet.mnemonic);
    } else {
      wallet = ethers.Wallet.createRandom();
    }

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'wallet-creation',
      status: 'confirmed',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      network: data.data.network || 'ethereum',
      result: {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: 'mnemonic' in wallet ? wallet.mnemonic?.phrase : undefined
      }
    };
  }

  private async processTokenValidation(
    data: BlockchainJobData,
    jobId: string,
    job: Job,
    provider: ethers.JsonRpcProvider
  ): Promise<BlockchainResult> {
    const token = data.data.token!;
    
    await job.updateProgress(30);

    const tokenContract = new ethers.Contract(
      token.address,
      ['function name() view returns (string)', 'function symbol() view returns (string)', 'function decimals() view returns (uint8)', 'function totalSupply() view returns (uint256)'],
      provider
    );

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name().catch(() => 'Unknown'),
      tokenContract.symbol().catch(() => 'Unknown'),
      tokenContract.decimals().catch(() => 18),
      tokenContract.totalSupply().catch(() => 0n)
    ]);

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'token-validation',
      status: 'confirmed',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      network: data.data.network || 'ethereum',
      result: {
        address: token.address,
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
        isValid: name !== 'Unknown' && symbol !== 'Unknown'
      }
    };
  }

  private async processPriceFetch(
    data: BlockchainJobData,
    jobId: string,
    job: Job
  ): Promise<BlockchainResult> {
    await job.updateProgress(40);

    // Mock price fetching (replace with actual API calls)
    const mockPrices = {
      ethereum: 2000 + Math.random() * 500,
      bitcoin: 40000 + Math.random() * 10000,
      polygon: 0.8 + Math.random() * 0.4
    };

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'price-fetch',
      status: 'confirmed',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      network: data.data.network || 'ethereum',
      result: {
        prices: mockPrices,
        timestamp: new Date().toISOString()
      }
    };
  }

  private getStatsKey(type: string): keyof typeof this.transactionStats | null {
    const mapping: Record<string, keyof typeof this.transactionStats> = {
      'transaction': 'transaction',
      'token-transfer': 'tokenTransfer',
      'nft-mint': 'nftMint',
      'smart-contract': 'smartContract',
      'balance-check': 'balanceCheck',
      'gas-estimation': 'gasEstimation',
      'wallet-creation': 'walletCreation',
      'token-validation': 'tokenValidation',
      'price-fetch': 'priceFetch'
    };
    return mapping[type] || null;
  }

  // Public methods for monitoring and management
  getTransactionStats() {
    return { ...this.transactionStats };
  }

  resetStats(): void {
    Object.keys(this.transactionStats).forEach(key => {
      this.transactionStats[key as keyof typeof this.transactionStats] = {
        processed: 0,
        confirmed: 0,
        failed: 0,
        totalGasUsed: 0
      };
    });
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const details: Record<string, any> = {
      initialized: this.isInitialized,
      networks: Object.keys(this.providers),
      totalTransactions: Object.values(this.transactionStats).reduce((sum, stat) => sum + stat.processed, 0),
      totalConfirmed: Object.values(this.transactionStats).reduce((sum, stat) => sum + stat.confirmed, 0),
      totalFailed: Object.values(this.transactionStats).reduce((sum, stat) => sum + stat.failed, 0),
      totalGasUsed: Object.values(this.transactionStats).reduce((sum, stat) => sum + stat.totalGasUsed, 0)
    };

    const successRate = details.totalConfirmed / (details.totalConfirmed + details.totalFailed) || 1;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (successRate < 0.8) {
      status = 'unhealthy';
    } else if (successRate < 0.95) {
      status = 'degraded';
    }

    return { status, details };
  }
}