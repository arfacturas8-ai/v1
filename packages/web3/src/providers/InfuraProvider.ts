import { ethers } from 'ethers';
import { Transaction } from '../types';

export class InfuraProvider {
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Signer;

  constructor(apiKey: string, network: string = 'mainnet') {
    this.provider = new ethers.InfuraProvider(network, apiKey);
  }

  async connect(privateKey?: string): Promise<void> {
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async getTokenBalance(tokenContract: string, walletAddress: string): Promise<string> {
    const contract = new ethers.Contract(
      tokenContract,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );
    
    const balance = await contract.balanceOf(walletAddress);
    return balance.toString();
  }

  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer available');
    }

    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.parseEther(value),
      data
    });

    return tx.hash;
  }

  async getTransaction(hash: string): Promise<Transaction> {
    const tx = await this.provider.getTransaction(hash);
    const receipt = await this.provider.getTransactionReceipt(hash);
    
    if (!tx) {
      throw new Error('Transaction not found');
    }

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      value: ethers.formatEther(tx.value),
      gasPrice: tx.gasPrice?.toString(),
      gasLimit: tx.gasLimit.toString(),
      status: receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending',
      blockNumber: receipt?.blockNumber,
      timestamp: Date.now(),
      network: (await this.provider.getNetwork()).name
    };
  }

  async estimateGas(to: string, data: string): Promise<string> {
    const gasEstimate = await this.provider.estimateGas({ to, data });
    return gasEstimate.toString();
  }

  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getNetwork(): Promise<any> {
    return await this.provider.getNetwork();
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}