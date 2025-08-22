export interface CoinDetails {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  marketCap: number;
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
}

export interface PricePoint {
  timestamp: Date;
  price: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  thumb: string;
}

export interface GlobalMarketData {
  totalMarketCap: number;
  totalVolume: number;
  marketCapPercentage: Record<string, number>;
  activeCryptocurrencies: number;
  markets: number;
  marketCapChangePercentage24h: number;
}

export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  thumb: string;
}

export class CoingeckoClient {
  private baseUrl: string = 'https://api.coingecko.com/api/v3';
  private proUrl: string = 'https://pro-api.coingecko.com/api/v3';
  private apiKey?: string;
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = 60000; // 1 minute cache

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private getApiUrl(): string {
    return this.apiKey ? this.proUrl : this.baseUrl;
  }

  private async request(endpoint: string, params?: Record<string, any>): Promise<any> {
    // Check cache first
    const cacheKey = `${endpoint}${params ? JSON.stringify(params) : ''}`;
    const cached = this.requestCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const url = new URL(`${this.getApiUrl()}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const headers: HeadersInit = {};
    
    if (this.apiKey) {
      headers['x-cg-pro-api-key'] = this.apiKey;
    }

    try {
      const response = await fetch(url.toString(), { headers });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`CoinGecko API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.requestCache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error: any) {
      throw new Error(`CoinGecko request failed: ${error.message}`);
    }
  }

  // Get current price of cryptocurrencies
  async getCurrentPrices(
    coins: string[],
    currencies: string[] = ['usd']
  ): Promise<Record<string, Record<string, number>>> {
    const coinsParam = coins.join(',');
    const currenciesParam = currencies.join(',');
    
    return await this.request('/simple/price', {
      ids: coinsParam,
      vs_currencies: currenciesParam,
      include_24hr_change: true,
      include_24hr_vol: true,
      include_last_updated_at: true
    });
  }

  // Get detailed coin information
  async getCoinDetails(coinId: string): Promise<CoinDetails> {
    const data = await this.request(`/coins/${coinId}`, {
      localization: false,
      tickers: false,
      community_data: false,
      developer_data: false,
      sparkline: false
    });
    
    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      description: data.description?.en || '',
      image: data.image?.large || '',
      marketCap: data.market_data?.market_cap?.usd || 0,
      currentPrice: data.market_data?.current_price?.usd || 0,
      priceChange24h: data.market_data?.price_change_percentage_24h || 0,
      volume24h: data.market_data?.total_volume?.usd || 0,
      circulatingSupply: data.market_data?.circulating_supply || 0,
      totalSupply: data.market_data?.total_supply || 0,
      maxSupply: data.market_data?.max_supply || 0
    };
  }

  // Get historical price data
  async getHistoricalPrices(
    coinId: string,
    days: number = 30,
    currency: string = 'usd'
  ): Promise<PricePoint[]> {
    const data = await this.request(`/coins/${coinId}/market_chart`, {
      vs_currency: currency,
      days: days,
      interval: days > 90 ? 'daily' : undefined
    });

    return (data.prices || []).map(([timestamp, price]: [number, number]) => ({
      timestamp: new Date(timestamp),
      price
    }));
  }

  // Get trending coins
  async getTrendingCoins(): Promise<TrendingCoin[]> {
    const data = await this.request('/search/trending');
    
    return (data.coins || []).map((coin: any) => ({
      id: coin.item.id,
      name: coin.item.name,
      symbol: coin.item.symbol,
      marketCapRank: coin.item.market_cap_rank || 0,
      thumb: coin.item.thumb || ''
    }));
  }

  // Get market overview
  async getGlobalMarketData(): Promise<GlobalMarketData> {
    const data = await this.request('/global');
    
    return {
      totalMarketCap: data.data?.total_market_cap?.usd || 0,
      totalVolume: data.data?.total_volume?.usd || 0,
      marketCapPercentage: data.data?.market_cap_percentage || {},
      activeCryptocurrencies: data.data?.active_cryptocurrencies || 0,
      markets: data.data?.markets || 0,
      marketCapChangePercentage24h: data.data?.market_cap_change_percentage_24h_usd || 0
    };
  }

  // Search for coins
  async searchCoins(query: string): Promise<CoinSearchResult[]> {
    const data = await this.request('/search', { query });
    
    return (data.coins || []).map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      marketCapRank: coin.market_cap_rank || 0,
      thumb: coin.thumb || ''
    }));
  }

  // Get supported currencies
  async getSupportedCurrencies(): Promise<string[]> {
    return await this.request('/simple/supported_vs_currencies');
  }

  // Get coin list
  async getCoinList(includePlatform: boolean = false): Promise<any[]> {
    return await this.request('/coins/list', {
      include_platform: includePlatform
    });
  }

  // Get exchanges list
  async getExchanges(perPage: number = 100, page: number = 1): Promise<any[]> {
    return await this.request('/exchanges', {
      per_page: perPage,
      page: page
    });
  }

  // Get DeFi data
  async getDefiData(): Promise<any> {
    return await this.request('/global/decentralized_finance_defi');
  }

  // Get coin price by contract address
  async getTokenPrice(
    platform: string,
    contractAddress: string,
    currencies: string[] = ['usd']
  ): Promise<any> {
    const currenciesParam = currencies.join(',');
    
    return await this.request(`/simple/token_price/${platform}`, {
      contract_addresses: contractAddress,
      vs_currencies: currenciesParam,
      include_24hr_change: true
    });
  }

  // Get OHLC data (candlestick)
  async getOHLCData(
    coinId: string,
    currency: string = 'usd',
    days: number = 7
  ): Promise<any[]> {
    return await this.request(`/coins/${coinId}/ohlc`, {
      vs_currency: currency,
      days: days
    });
  }

  // Get coin categories
  async getCategories(): Promise<any[]> {
    return await this.request('/coins/categories');
  }

  // Clear cache
  clearCache(): void {
    this.requestCache.clear();
  }

  // Set cache timeout
  setCacheTimeout(ms: number): void {
    this.cacheTimeout = ms;
  }

  // Format price for display
  static formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 8 : 2
    }).format(price);
  }

  // Format market cap
  static formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  }

  // Format percentage change
  static formatPercentageChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }
}