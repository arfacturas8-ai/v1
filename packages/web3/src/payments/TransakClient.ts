export interface TransakWidgetConfig {
  apiKey: string;
  environment: 'staging' | 'production';
  walletAddress?: string;
  defaultCryptoCurrency?: string;
  defaultFiatCurrency?: string;
  defaultPaymentMethod?: string;
  themeColor?: string;
  widgetHeight?: string;
  widgetWidth?: string;
  email?: string;
  userData?: any;
  onSuccess?: (orderData: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

export interface SupportedCrypto {
  symbol: string;
  name: string;
  network: string;
  isAllowed: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface SupportedFiat {
  symbol: string;
  name: string;
  isAllowed: boolean;
}

export interface ExchangeRate {
  fiatCurrency: string;
  cryptoCurrency: string;
  conversionPrice: number;
  slippage: number;
  fees: any;
}

export interface TransakOrder {
  id: string;
  status: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  fiatAmount: number;
  cryptoAmount: number;
  walletAddress: string;
  redirectUrl: string;
  paymentMethod?: string;
  createdAt?: Date;
}

export class TransakClient {
  private apiKey: string;
  private environment: 'staging' | 'production';
  private baseUrl: string;
  private widgetUrl: string;

  constructor(apiKey: string, environment: 'staging' | 'production' = 'staging') {
    this.apiKey = apiKey;
    this.environment = environment;
    this.baseUrl = environment === 'production' 
      ? 'https://api.transak.com' 
      : 'https://staging-api.transak.com';
    this.widgetUrl = environment === 'production'
      ? 'https://global.transak.com'
      : 'https://staging-global.transak.com';
  }

  // Initialize Transak widget
  createWidget(config: Partial<TransakWidgetConfig>): TransakWidget {
    return new TransakWidget({
      apiKey: this.apiKey,
      environment: this.environment,
      ...config
    });
  }

  // API request helper
  private async request(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Transak API error: ${response.status} - ${error}`);
      }

      return response.json();
    } catch (error: any) {
      throw new Error(`Transak request failed: ${error.message}`);
    }
  }

  // Get supported cryptocurrencies
  async getSupportedCryptocurrencies(): Promise<SupportedCrypto[]> {
    const response = await this.request('/api/v2/currencies/crypto-currencies');
    return (response.response || []).map((crypto: any) => ({
      symbol: crypto.symbol,
      name: crypto.name,
      network: crypto.network,
      isAllowed: crypto.isAllowed,
      minAmount: crypto.minAmount,
      maxAmount: crypto.maxAmount
    }));
  }

  // Get supported fiat currencies
  async getSupportedFiatCurrencies(): Promise<SupportedFiat[]> {
    const response = await this.request('/api/v2/currencies/fiat-currencies');
    return (response.response || []).map((fiat: any) => ({
      symbol: fiat.symbol,
      name: fiat.name,
      isAllowed: fiat.isAllowed
    }));
  }

  // Get supported countries
  async getSupportedCountries(): Promise<any[]> {
    const response = await this.request('/api/v2/countries');
    return (response.response || []).map((country: any) => ({
      alpha2: country.alpha2,
      alpha3: country.alpha3,
      name: country.name,
      isAllowed: country.isAllowed,
      supportedDocuments: country.supportedDocuments
    }));
  }

  // Get exchange rates
  async getExchangeRates(
    fiatCurrency: string,
    cryptoCurrency: string,
    isBuyOrSell: 'BUY' | 'SELL',
    network?: string,
    paymentMethod?: string
  ): Promise<ExchangeRate> {
    const params = new URLSearchParams({
      fiatCurrency,
      cryptoCurrency,
      isBuyOrSell,
      ...(network && { network }),
      ...(paymentMethod && { paymentMethod })
    });

    const response = await this.request(`/api/v2/currencies/price?${params}`);
    return {
      fiatCurrency: response.response.fiatCurrency,
      cryptoCurrency: response.response.cryptoCurrency,
      conversionPrice: response.response.conversionPrice,
      slippage: response.response.slippage,
      fees: response.response.fees
    };
  }

  // Create order
  async createOrder(orderData: {
    fiatCurrency: string;
    cryptoCurrency: string;
    isBuyOrSell: 'BUY' | 'SELL';
    fiatAmount?: number;
    cryptoAmount?: number;
    walletAddress: string;
    email?: string;
    paymentMethod?: string;
    userData?: any;
  }): Promise<TransakOrder> {
    const response = await this.request('/api/v2/orders', 'POST', orderData);
    return {
      id: response.response.id,
      status: response.response.status,
      fiatCurrency: response.response.fiatCurrency,
      cryptoCurrency: response.response.cryptoCurrency,
      fiatAmount: response.response.fiatAmount,
      cryptoAmount: response.response.cryptoAmount,
      walletAddress: response.response.walletAddress,
      redirectUrl: response.response.redirectURL,
      paymentMethod: response.response.paymentMethod,
      createdAt: new Date(response.response.createdAt)
    };
  }

  // Get order status
  async getOrderStatus(orderId: string): Promise<any> {
    const response = await this.request(`/api/v2/orders/${orderId}`);
    return {
      id: response.response.id,
      status: response.response.status,
      statusReason: response.response.statusReason,
      transactionHash: response.response.transactionHash,
      transactionLink: response.response.transactionLink,
      fiatCurrency: response.response.fiatCurrency,
      cryptoCurrency: response.response.cryptoCurrency,
      fiatAmount: response.response.fiatAmount,
      cryptoAmount: response.response.cryptoAmount,
      completedAt: response.response.completedAt ? new Date(response.response.completedAt) : null
    };
  }

  // Get user orders
  async getUserOrders(email: string): Promise<TransakOrder[]> {
    const response = await this.request(`/api/v2/orders?email=${encodeURIComponent(email)}`);
    return (response.response || []).map((order: any) => ({
      id: order.id,
      status: order.status,
      fiatCurrency: order.fiatCurrency,
      cryptoCurrency: order.cryptoCurrency,
      fiatAmount: order.fiatAmount,
      cryptoAmount: order.cryptoAmount,
      walletAddress: order.walletAddress,
      redirectUrl: order.redirectURL,
      createdAt: new Date(order.createdAt)
    }));
  }

  // Calculate fees
  async calculateFees(
    fiatAmount: number,
    fiatCurrency: string,
    cryptoCurrency: string,
    paymentMethod: string
  ): Promise<any> {
    const params = new URLSearchParams({
      fiatAmount: fiatAmount.toString(),
      fiatCurrency,
      cryptoCurrency,
      paymentMethod
    });

    const response = await this.request(`/api/v2/currencies/calculate-fees?${params}`);
    return response.response;
  }

  // Get payment methods
  async getPaymentMethods(country?: string): Promise<any[]> {
    const endpoint = country 
      ? `/api/v2/payment-methods?country=${country}`
      : '/api/v2/payment-methods';
    
    const response = await this.request(endpoint);
    return response.response || [];
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implementation would depend on Transak's webhook signature method
    // This is a placeholder
    const crypto = typeof window !== 'undefined' 
      ? window.crypto 
      : require('crypto');
    
    // Implement actual signature verification based on Transak's documentation
    return true; // Placeholder
  }
}

// Transak Widget Implementation
export class TransakWidget {
  private config: TransakWidgetConfig;
  private widget?: any;
  private scriptLoaded: boolean = false;

  constructor(config: TransakWidgetConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('TransakWidget can only be initialized in browser environment');
    }

    // Load Transak SDK if not already loaded
    if (!this.scriptLoaded) {
      await this.loadTransakSDK();
    }

    // Initialize widget
    this.widget = new (window as any).TransakSDK({
      apiKey: this.config.apiKey,
      environment: this.config.environment,
      defaultCryptoCurrency: this.config.defaultCryptoCurrency || 'ETH',
      defaultFiatCurrency: this.config.defaultFiatCurrency || 'USD',
      defaultPaymentMethod: this.config.defaultPaymentMethod || 'credit_debit_card',
      walletAddress: this.config.walletAddress,
      themeColor: this.config.themeColor || '#0052FF',
      hostURL: window.location.origin,
      widgetHeight: this.config.widgetHeight || '625px',
      widgetWidth: this.config.widgetWidth || '450px',
      email: this.config.email,
      userData: this.config.userData
    });

    this.widget.init();

    // Set up event listeners
    this.setupEventListeners();
  }

  private async loadTransakSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).TransakSDK) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.config.environment === 'production'
        ? 'https://global.transak.com/sdk/v1.2/transak.js'
        : 'https://staging-global.transak.com/sdk/v1.2/transak.js';
      
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Transak SDK'));
      };
      
      document.head.appendChild(script);
    });
  }

  private setupEventListeners(): void {
    if (!this.widget) return;

    // Widget initialized
    this.widget.on('TRANSAK_WIDGET_INITIALISED', () => {
      console.log('Transak widget initialized');
    });

    // Order successful
    this.widget.on('TRANSAK_ORDER_SUCCESSFUL', (orderData: any) => {
      console.log('Order successful:', orderData);
      this.config.onSuccess?.(orderData);
    });

    // Order failed
    this.widget.on('TRANSAK_ORDER_FAILED', (error: any) => {
      console.error('Order failed:', error);
      this.config.onError?.(error);
    });

    // Widget closed
    this.widget.on('TRANSAK_WIDGET_CLOSE', () => {
      console.log('Widget closed');
      this.config.onClose?.();
    });

    // Order created
    this.widget.on('TRANSAK_ORDER_CREATED', (orderData: any) => {
      console.log('Order created:', orderData);
    });
  }

  // Open the widget
  open(): void {
    if (!this.widget) {
      throw new Error('Widget not initialized. Call init() first.');
    }
    this.widget.openWidget();
  }

  // Close the widget
  close(): void {
    if (this.widget) {
      this.widget.close();
    }
  }

  // Update widget configuration
  updateConfig(config: Partial<TransakWidgetConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.widget) {
      // Re-initialize with new config
      this.widget = null;
      this.init();
    }
  }

  // Get widget instance
  getWidget(): any {
    return this.widget;
  }

  // Destroy widget
  destroy(): void {
    if (this.widget) {
      this.widget.close();
      this.widget = null;
    }
  }
}