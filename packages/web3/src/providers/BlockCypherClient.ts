import { Transaction } from '../types';

export interface BitcoinAddressInfo {
  address: string;
  balance: number;
  unconfirmedBalance: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
}

export interface BitcoinTransaction {
  hash: string;
  blockHeight?: number;
  blockHash?: string;
  received: Date;
  confirmed?: Date;
  inputs: { address: string; value: number }[];
  outputs: { address: string; value: number }[];
  fees: number;
  size: number;
}

export class BlockCypherClient {
  private baseUrl: string = 'https://api.blockcypher.com/v1/btc/main';
  private testnetUrl: string = 'https://api.blockcypher.com/v1/btc/test3';
  private token?: string;
  private useTestnet: boolean = false;

  constructor(token?: string, useTestnet: boolean = false) {
    this.token = token;
    this.useTestnet = useTestnet;
  }

  private getApiUrl(): string {
    return this.useTestnet ? this.testnetUrl : this.baseUrl;
  }

  private async request(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<any> {
    const baseUrl = this.getApiUrl();
    const url = `${baseUrl}${endpoint}${this.token ? `?token=${this.token}` : ''}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`BlockCypher API error: ${response.status} - ${error}`);
      }

      return response.json();
    } catch (error: any) {
      throw new Error(`BlockCypher request failed: ${error.message}`);
    }
  }

  // Get Bitcoin address information
  async getAddress(address: string): Promise<BitcoinAddressInfo> {
    const data = await this.request(`/addrs/${address}`);
    return {
      address: data.address,
      balance: data.balance || 0,
      unconfirmedBalance: data.unconfirmed_balance || 0,
      totalReceived: data.total_received || 0,
      totalSent: data.total_sent || 0,
      txCount: data.n_tx || 0
    };
  }

  // Get transaction details
  async getTransaction(txHash: string): Promise<Transaction> {
    const data = await this.request(`/txs/${txHash}`);
    
    let status: 'pending' | 'confirmed' | 'failed' = 'pending';
    if (data.confirmations > 0) {
      status = 'confirmed';
    } else if (data.double_spend) {
      status = 'failed';
    }

    return {
      hash: data.hash,
      from: data.inputs?.[0]?.addresses?.[0] || 'unknown',
      to: data.outputs?.[0]?.addresses?.[0] || 'unknown',
      value: (data.total / 100000000).toString(), // Convert satoshis to BTC
      status,
      blockNumber: data.block_height,
      timestamp: data.received ? new Date(data.received).getTime() : Date.now(),
      network: 'bitcoin'
    };
  }

  // Get detailed transaction information
  async getDetailedTransaction(txHash: string): Promise<BitcoinTransaction> {
    const data = await this.request(`/txs/${txHash}`);
    return {
      hash: data.hash,
      blockHeight: data.block_height,
      blockHash: data.block_hash,
      received: new Date(data.received),
      confirmed: data.confirmed ? new Date(data.confirmed) : undefined,
      inputs: (data.inputs || []).map((input: any) => ({
        address: input.addresses?.[0] || 'unknown',
        value: input.output_value || 0
      })),
      outputs: (data.outputs || []).map((output: any) => ({
        address: output.addresses?.[0] || 'unknown',
        value: output.value || 0
      })),
      fees: data.fees || 0,
      size: data.size || 0
    };
  }

  // Get current Bitcoin price in USD
  async getCurrentPrice(): Promise<number> {
    try {
      // Use CoinDesk API for price (BlockCypher doesn't provide price data)
      const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
      const data = await response.json();
      return parseFloat(data.bpi.USD.rate.replace(',', ''));
    } catch (error) {
      // Fallback to a default or cached value
      console.error('Failed to fetch Bitcoin price:', error);
      return 0;
    }
  }

  // Get address balance in BTC
  async getBalance(address: string): Promise<number> {
    const info = await this.getAddress(address);
    return info.balance / 100000000; // Convert satoshis to BTC
  }

  // Get unconfirmed balance in BTC
  async getUnconfirmedBalance(address: string): Promise<number> {
    const info = await this.getAddress(address);
    return info.unconfirmedBalance / 100000000;
  }

  // Get address transactions
  async getAddressTransactions(address: string, limit: number = 50): Promise<string[]> {
    const data = await this.request(`/addrs/${address}?limit=${limit}`);
    return (data.txrefs || []).map((tx: any) => tx.tx_hash);
  }

  // Create new transaction (simplified - needs proper implementation)
  async createTransaction(
    fromAddress: string,
    toAddress: string,
    amountBTC: number,
    privateKey?: string
  ): Promise<string> {
    // Get unspent outputs
    const utxos = await this.request(`/addrs/${fromAddress}?unspentOnly=true`);
    
    if (!utxos.txrefs || utxos.txrefs.length === 0) {
      throw new Error('No unspent outputs available');
    }

    const amountSatoshis = Math.floor(amountBTC * 100000000);
    
    // Build transaction
    const tx = {
      inputs: utxos.txrefs.slice(0, 5).map((utxo: any) => ({
        addresses: [fromAddress],
        prev_hash: utxo.tx_hash,
        output_index: utxo.tx_output_n
      })),
      outputs: [{
        addresses: [toAddress],
        value: amountSatoshis
      }]
    };

    // Create unsigned transaction
    const newTx = await this.request('/txs/new', 'POST', tx);
    
    // Note: Actual signing would require bitcoinjs-lib or similar
    // This is a placeholder for the signing process
    if (privateKey) {
      console.warn('Transaction signing not fully implemented. Use bitcoinjs-lib for production.');
      // const signedTx = this.signTransaction(newTx, privateKey);
      // const result = await this.request('/txs/send', 'POST', signedTx);
      // return result.tx.hash;
    }
    
    return newTx.tx.hash;
  }

  // Monitor address for new transactions (webhook)
  async subscribeToAddress(address: string, webhookUrl: string): Promise<string> {
    const subscription = await this.request('/hooks', 'POST', {
      event: 'confirmed-tx',
      address,
      url: webhookUrl
    });
    return subscription.id;
  }

  // Unsubscribe from address monitoring
  async unsubscribeFromAddress(webhookId: string): Promise<void> {
    await this.request(`/hooks/${webhookId}`, 'DELETE');
  }

  // Get blockchain info
  async getBlockchainInfo(): Promise<any> {
    return await this.request('');
  }

  // Get latest block
  async getLatestBlock(): Promise<any> {
    const blockchain = await this.getBlockchainInfo();
    return await this.request(`/blocks/${blockchain.latest_hash}`);
  }

  // Validate Bitcoin address
  static isValidAddress(address: string, network: 'mainnet' | 'testnet' = 'mainnet'): boolean {
    // Basic Bitcoin address validation
    if (network === 'mainnet') {
      // P2PKH addresses start with 1
      // P2SH addresses start with 3
      // Bech32 addresses start with bc1
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ||
             /^bc1[a-z0-9]{39,59}$/.test(address);
    } else {
      // Testnet addresses
      return /^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ||
             /^tb1[a-z0-9]{39,59}$/.test(address);
    }
  }

  // Convert satoshis to BTC
  static satoshisToBTC(satoshis: number): number {
    return satoshis / 100000000;
  }

  // Convert BTC to satoshis
  static btcToSatoshis(btc: number): number {
    return Math.round(btc * 100000000);
  }

  // Format BTC amount for display
  static formatBTC(btc: number, decimals: number = 8): string {
    return btc.toFixed(decimals).replace(/\.?0+$/, '');
  }
}