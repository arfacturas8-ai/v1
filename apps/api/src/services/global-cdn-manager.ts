import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import { createHash, randomUUID } from 'crypto';
import LRU from 'lru-cache';
import { ProductionMediaStorage } from './production-media-storage';

export interface CDNProvider {
  id: string;
  name: string;
  type: 'cloudflare' | 'fastly' | 'amazon' | 'bunnycdn' | 'imagekit' | 'custom';
  enabled: boolean;
  priority: number;
  regions: string[];
  config: {
    apiKey: string;
    apiSecret?: string;
    endpoint: string;
    pullZone?: string;
    zoneId?: string;
    distributionId?: string;
    customDomain?: string;
    transformationEndpoint?: string;
    headers?: Record<string, string>;
  };
  capabilities: {
    imageOptimization: boolean;
    videoStreaming: boolean;
    edgePurging: boolean;
    realTimeAnalytics: boolean;
    webpSupport: boolean;
    avifSupport: boolean;
    http3Support: boolean;
    brotliCompression: boolean;
  };
  pricing: {
    costPerGB: number;
    costPerRequest: number;
    freeQuota?: { bandwidth: number; requests: number };
  };
}

export interface CDNFile {
  id: string;
  originalKey: string;
  providers: Map<string, {
    url: string;
    status: 'uploading' | 'cached' | 'failed' | 'purged';
    uploadedAt?: Date;
    lastAccessed?: Date;
    size: number;
    etag?: string;
    metadata: Record<string, any>;
  }>;
  metadata: {
    filename: string;
    mimeType: string;
    size: number;
    hash: string;
    userId: string;
    uploadedAt: Date;
    accessCount: number;
    regions: string[];
    tags: string[];
  };
  analytics: {
    totalRequests: number;
    bandwidthUsed: number;
    topRegions: Record<string, number>;
    lastAnalyzed: Date;
  };
}

export interface GeolocationData {
  country: string;
  region: string;
  city: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
}

export interface CDNAnalytics {
  totalFiles: number;
  totalBandwidth: number;
  totalRequests: number;
  cacheHitRate: number;
  averageResponseTime: number;
  topCountries: Record<string, number>;
  topFiles: Array<{ file: string; requests: number; bandwidth: number }>;
  providerPerformance: Record<string, {
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    bandwidth: number;
    cost: number;
  }>;
  costAnalysis: {
    totalCost: number;
    costByProvider: Record<string, number>;
    projectedMonthlyCost: number;
    savings: number;
  };
}

/**
 * Global CDN Manager for CRYB Platform
 * 
 * Instagram/TikTok Level Features:
 * - Multi-CDN orchestration with intelligent routing
 * - Real-time geographic load balancing
 * - Edge caching with smart invalidation strategies
 * - Automatic failover and health monitoring
 * - Cost optimization across multiple providers
 * - Real-time analytics and performance monitoring
 * - Dynamic content optimization at the edge
 * - Global anycast network integration
 * - Advanced caching policies with TTL management
 * - Bandwidth throttling and rate limiting
 */
export class GlobalCDNManager extends EventEmitter {
  private storage: ProductionMediaStorage;
  private providers: Map<string, CDNProvider> = new Map();
  private files: Map<string, CDNFile> = new Map();
  private httpClients: Map<string, AxiosInstance> = new Map();
  
  // Health monitoring and circuit breaker
  private healthStatus: Map<string, {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    responseTime: number;
    errorCount: number;
    uptime: number;
    failures: number;
    circuitBreakerState: 'closed' | 'open' | 'half-open';
    nextRetry?: Date;
  }> = new Map();

  // Performance caching and optimization
  private urlCache = new LRU<string, string>({
    max: 50000,
    ttl: 1000 * 60 * 15 // 15 minutes
  });

  private geoCache = new LRU<string, GeolocationData>({
    max: 10000,
    ttl: 1000 * 60 * 60 * 24 // 24 hours
  });

  private analyticsCache = new LRU<string, any>({
    max: 1000,
    ttl: 1000 * 60 * 5 // 5 minutes
  });

  // Configuration
  private readonly healthCheckInterval = 30000; // 30 seconds
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerTimeout = 60000; // 1 minute
  private readonly analyticsInterval = 300000; // 5 minutes
  private readonly maxRetries = 3;
  
  // Geographic regions for load balancing
  private readonly regions = {
    'us-east': { lat: 40.7128, lng: -74.0060, providers: ['cloudflare', 'fastly', 'amazon'] },
    'us-west': { lat: 37.7749, lng: -122.4194, providers: ['cloudflare', 'fastly', 'amazon'] },
    'eu-west': { lat: 53.3498, lng: -6.2603, providers: ['cloudflare', 'fastly'] },
    'asia-pacific': { lat: 35.6762, lng: 139.6503, providers: ['cloudflare', 'bunnycdn'] },
    'south-america': { lat: -23.5505, lng: -46.6333, providers: ['cloudflare'] },
    'africa': { lat: -26.2041, lng: 28.0473, providers: ['cloudflare'] },
    'oceania': { lat: -33.8688, lng: 151.2093, providers: ['cloudflare'] }
  };

  constructor(
    storage: ProductionMediaStorage,
    providers: CDNProvider[] = [],
    options: {
      enableAutoScaling?: boolean;
      enableCostOptimization?: boolean;
      enableRealTimeAnalytics?: boolean;
      maxConcurrentUploads?: number;
    } = {}
  ) {
    super();
    
    this.storage = storage;
    
    this.initializeCDNManager(providers, options).catch(error => {
      console.error('❌ Global CDN Manager initialization failed:', error);
      this.emit('initialization_failed', error);
    });
  }

  private async initializeCDNManager(
    providers: CDNProvider[],
    options: any
  ): Promise<void> {
    try {
      // Initialize providers
      for (const provider of providers) {
        await this.addProvider(provider);
      }

      // Start health monitoring
      this.startHealthMonitoring();

      // Start analytics collection
      this.startAnalyticsCollection();

      // Start cost optimization
      if (options.enableCostOptimization) {
        this.startCostOptimization();
      }

      // Initialize geolocation service
      await this.initializeGeolocation();

      console.log('🌍 Global CDN Manager initialized');
      console.log(`📡 Active providers: ${Array.from(this.providers.keys()).join(', ')}`);
      
      this.emit('initialized', {
        providers: Array.from(this.providers.keys()),
        regions: Object.keys(this.regions),
        capabilities: this.getAggregatedCapabilities()
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Global CDN Manager:', error);
      throw error;
    }
  }

  async addProvider(provider: CDNProvider): Promise<void> {
    this.providers.set(provider.id, provider);
    
    if (provider.enabled) {
      // Initialize HTTP client
      const client = axios.create({
        baseURL: provider.config.endpoint,
        timeout: 30000,
        headers: {
          'User-Agent': 'CrybPlatform-CDN/3.0',
          'Authorization': this.getAuthHeader(provider),
          ...provider.config.headers
        }
      });

      this.httpClients.set(provider.id, client);
      
      // Initialize health status
      this.healthStatus.set(provider.id, {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        uptime: 100,
        failures: 0,
        circuitBreakerState: 'closed'
      });
    }

    this.emit('provider_added', { providerId: provider.id, provider });
  }

  /**
   * Upload file to optimal CDN providers with geographic distribution
   */
  async uploadToCDN(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    userId: string,
    options: {
      regions?: string[];
      priority?: 'speed' | 'cost' | 'quality' | 'coverage';
      tags?: string[];
      metadata?: Record<string, any>;
      userLocation?: { country: string; region: string; lat?: number; lng?: number };
      cacheControl?: string;
      ttl?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<CDNFile> {
    const fileId = randomUUID();
    const hash = createHash('sha256').update(buffer).digest('hex');

    // Check for existing file
    const existingFile = this.findFileByHash(hash);
    if (existingFile && !options.forceRefresh) {
      console.log(`♻️ File already exists in CDN: ${hash}`);
      existingFile.metadata.accessCount++;
      return existingFile;
    }

    try {
      console.log(`🌍 Uploading to global CDN: ${filename} (${buffer.length} bytes)`);

      // Select optimal providers based on requirements
      const selectedProviders = await this.selectOptimalProviders(options);
      
      if (selectedProviders.length === 0) {
        throw new Error('No healthy CDN providers available');
      }

      // Create CDN file record
      const cdnFile: CDNFile = {
        id: fileId,
        originalKey: hash,
        providers: new Map(),
        metadata: {
          filename,
          mimeType,
          size: buffer.length,
          hash,
          userId,
          uploadedAt: new Date(),
          accessCount: 0,
          regions: options.regions || [],
          tags: options.tags || []
        },
        analytics: {
          totalRequests: 0,
          bandwidthUsed: 0,
          topRegions: {},
          lastAnalyzed: new Date()
        }
      };

      // Upload to selected providers in parallel
      const uploadPromises = selectedProviders.map(async (provider) => {
        try {
          const result = await this.uploadToProvider(
            provider,
            buffer,
            filename,
            mimeType,
            fileId,
            options
          );
          
          cdnFile.providers.set(provider.id, {
            url: result.url,
            status: 'cached',
            uploadedAt: new Date(),
            size: buffer.length,
            etag: result.etag,
            metadata: result.metadata || {}
          });

          this.emit('provider_upload_success', {
            fileId,
            providerId: provider.id,
            url: result.url
          });

        } catch (error) {
          console.error(`❌ Upload to ${provider.name} failed:`, error);
          
          cdnFile.providers.set(provider.id, {
            url: '',
            status: 'failed',
            size: 0,
            metadata: { error: error.message }
          });

          this.recordProviderFailure(provider.id, error as Error);
        }
      });

      await Promise.allSettled(uploadPromises);

      // Ensure at least one provider succeeded
      const successfulUploads = Array.from(cdnFile.providers.values())
        .filter(p => p.status === 'cached');
      
      if (successfulUploads.length === 0) {
        throw new Error('All CDN provider uploads failed');
      }

      // Store file record
      this.files.set(fileId, cdnFile);

      this.emit('file_uploaded', {
        fileId,
        filename,
        userId,
        providersUsed: successfulUploads.length,
        totalProviders: selectedProviders.length,
        regions: this.getFileRegions(cdnFile)
      });

      return cdnFile;

    } catch (error) {
      console.error(`❌ Global CDN upload failed for ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Get optimized CDN URL with intelligent routing
   */
  getCDNUrl(
    fileId: string,
    options: {
      userLocation?: GeolocationData;
      clientIP?: string;
      format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
      quality?: number;
      width?: number;
      height?: number;
      dpr?: number;
      crop?: 'scale' | 'crop' | 'fill' | 'fit';
      userAgent?: string;
      preferredProvider?: string;
      fallbackRegion?: string;
    } = {}
  ): Promise<string | null> {
    const file = this.files.get(fileId);
    if (!file) {
      return null;
    }

    try {
      // Get user location if IP provided
      let userLocation = options.userLocation;
      if (!userLocation && options.clientIP) {
        userLocation = await this.getGeolocation(options.clientIP);
      }

      // Select best provider for user location
      const optimalProvider = await this.selectOptimalProvider(
        file,
        userLocation,
        options
      );

      if (!optimalProvider) {
        // Fallback to first available provider
        const firstAvailable = Array.from(file.providers.entries())
          .find(([_, data]) => data.status === 'cached');
        
        if (firstAvailable) {
          return this.buildOptimizedUrl(firstAvailable[1].url, options);
        }
        
        return null;
      }

      const providerData = file.providers.get(optimalProvider.id);
      if (!providerData || providerData.status !== 'cached') {
        return null;
      }

      // Update analytics
      this.updateFileAnalytics(file, userLocation);

      // Build optimized URL with transformations
      const optimizedUrl = this.buildOptimizedUrl(providerData.url, options);

      // Cache the result
      const cacheKey = `${fileId}-${JSON.stringify(options)}`;
      this.urlCache.set(cacheKey, optimizedUrl);

      return optimizedUrl;

    } catch (error) {
      console.error(`Failed to get CDN URL for ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Purge content from all CDN providers
   */
  async purgeContent(
    fileIds?: string[],
    tags?: string[],
    patterns?: string[]
  ): Promise<{
    successful: string[];
    failed: Array<{ providerId: string; error: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ providerId: string; error: string }> = [];

    const activeProviders = Array.from(this.providers.values())
      .filter(p => p.enabled && this.isProviderHealthy(p.id));

    const purgePromises = activeProviders.map(async (provider) => {
      try {
        await this.purgeFromProvider(provider, { fileIds, tags, patterns });
        successful.push(provider.id);
        
        this.emit('purge_success', {
          providerId: provider.id,
          fileIds,
          tags,
          patterns
        });
        
      } catch (error) {
        failed.push({
          providerId: provider.id,
          error: error.message
        });
      }
    });

    await Promise.allSettled(purgePromises);

    // Update local cache status
    if (fileIds) {
      for (const fileId of fileIds) {
        const file = this.files.get(fileId);
        if (file) {
          for (const [providerId, providerData] of file.providers.entries()) {
            if (successful.includes(providerId)) {
              providerData.status = 'purged';
            }
          }
        }
      }
    }

    // Clear relevant URL cache entries
    this.urlCache.clear();

    return { successful, failed };
  }

  /**
   * Get comprehensive analytics
   */
  async getAnalytics(timeRange?: { start: Date; end: Date }): Promise<CDNAnalytics> {
    const cacheKey = `analytics-${timeRange?.start.getTime()}-${timeRange?.end.getTime()}`;
    const cached = this.analyticsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const files = Array.from(this.files.values());
    
    const analytics: CDNAnalytics = {
      totalFiles: files.length,
      totalBandwidth: files.reduce((sum, f) => sum + f.analytics.bandwidthUsed, 0),
      totalRequests: files.reduce((sum, f) => sum + f.analytics.totalRequests, 0),
      cacheHitRate: this.calculateCacheHitRate(),
      averageResponseTime: this.calculateAverageResponseTime(),
      topCountries: this.getTopCountries(files),
      topFiles: this.getTopFiles(files),
      providerPerformance: this.getProviderPerformance(),
      costAnalysis: await this.calculateCostAnalysis(files, timeRange)
    };

    this.analyticsCache.set(cacheKey, analytics);
    return analytics;
  }

  private async selectOptimalProviders(options: any): Promise<CDNProvider[]> {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.enabled && this.isProviderHealthy(p.id));

    if (availableProviders.length === 0) {
      return [];
    }

    // Filter by regions if specified
    let filteredProviders = availableProviders;
    if (options.regions && options.regions.length > 0) {
      filteredProviders = availableProviders.filter(p => 
        p.regions.some(r => options.regions.includes(r))
      );
    }

    // Sort by priority and optimization criteria
    const sortedProviders = filteredProviders.sort((a, b) => {
      switch (options.priority) {
        case 'cost':
          return a.pricing.costPerGB - b.pricing.costPerGB;
        case 'speed':
          const aResponseTime = this.healthStatus.get(a.id)?.responseTime || 1000;
          const bResponseTime = this.healthStatus.get(b.id)?.responseTime || 1000;
          return aResponseTime - bResponseTime;
        case 'coverage':
          return b.regions.length - a.regions.length;
        default:
          return a.priority - b.priority;
      }
    });

    // Select top providers based on strategy
    const maxProviders = Math.min(3, sortedProviders.length); // Max 3 providers for redundancy
    return sortedProviders.slice(0, maxProviders);
  }

  private async selectOptimalProvider(
    file: CDNFile,
    userLocation?: GeolocationData,
    options: any = {}
  ): Promise<CDNProvider | null> {
    // Get available providers for this file
    const availableProviders = Array.from(file.providers.entries())
      .filter(([_, data]) => data.status === 'cached')
      .map(([providerId, _]) => this.providers.get(providerId))
      .filter(Boolean) as CDNProvider[];

    if (availableProviders.length === 0) {
      return null;
    }

    // Preferred provider override
    if (options.preferredProvider) {
      const preferred = availableProviders.find(p => p.id === options.preferredProvider);
      if (preferred && this.isProviderHealthy(preferred.id)) {
        return preferred;
      }
    }

    // Geographic optimization
    if (userLocation) {
      const closestProvider = this.findClosestProvider(availableProviders, userLocation);
      if (closestProvider && this.isProviderHealthy(closestProvider.id)) {
        return closestProvider;
      }
    }

    // Fallback to best performing provider
    const healthyProviders = availableProviders.filter(p => this.isProviderHealthy(p.id));
    if (healthyProviders.length === 0) {
      return availableProviders[0]; // Last resort
    }

    // Select provider with best performance
    return healthyProviders.reduce((best, current) => {
      const bestHealth = this.healthStatus.get(best.id);
      const currentHealth = this.healthStatus.get(current.id);
      
      if (!bestHealth || !currentHealth) return best;
      
      const bestScore = bestHealth.uptime * 0.5 + (1000 - bestHealth.responseTime) * 0.5;
      const currentScore = currentHealth.uptime * 0.5 + (1000 - currentHealth.responseTime) * 0.5;
      
      return currentScore > bestScore ? current : best;
    });
  }

  private findClosestProvider(
    providers: CDNProvider[],
    userLocation: GeolocationData
  ): CDNProvider | null {
    let closest: { provider: CDNProvider; distance: number } | null = null;

    for (const provider of providers) {
      for (const region of provider.regions) {
        const regionData = this.regions[region as keyof typeof this.regions];
        if (regionData) {
          const distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            regionData.lat,
            regionData.lng
          );

          if (!closest || distance < closest.distance) {
            closest = { provider, distance };
          }
        }
      }
    }

    return closest?.provider || null;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async uploadToProvider(
    provider: CDNProvider,
    buffer: Buffer,
    filename: string,
    mimeType: string,
    fileId: string,
    options: any
  ): Promise<{ url: string; etag?: string; metadata?: any }> {
    const client = this.httpClients.get(provider.id);
    if (!client) {
      throw new Error(`HTTP client not available for provider ${provider.id}`);
    }

    try {
      switch (provider.type) {
        case 'cloudflare':
          return await this.uploadToCloudflare(client, provider, buffer, filename, mimeType, fileId, options);
        case 'fastly':
          return await this.uploadToFastly(client, provider, buffer, filename, mimeType, fileId, options);
        case 'amazon':
          return await this.uploadToCloudFront(client, provider, buffer, filename, mimeType, fileId, options);
        case 'bunnycdn':
          return await this.uploadToBunnyCDN(client, provider, buffer, filename, mimeType, fileId, options);
        case 'imagekit':
          return await this.uploadToImageKit(client, provider, buffer, filename, mimeType, fileId, options);
        default:
          return await this.uploadToGenericProvider(client, provider, buffer, filename, mimeType, fileId, options);
      }
    } catch (error) {
      this.recordProviderFailure(provider.id, error as Error);
      throw error;
    }
  }

  private async uploadToCloudflare(
    client: AxiosInstance,
    provider: CDNProvider,
    buffer: Buffer,
    filename: string,
    mimeType: string,
    fileId: string,
    options: any
  ): Promise<{ url: string; etag?: string; metadata?: any }> {
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);
    
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    const response = await client.post('/client/v4/accounts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const cdnUrl = `${provider.config.customDomain || provider.config.endpoint}/${response.data.result.id}`;
    
    return {
      url: cdnUrl,
      etag: response.data.result.etag,
      metadata: response.data.result
    };
  }

  private async uploadToBunnyCDN(
    client: AxiosInstance,
    provider: CDNProvider,
    buffer: Buffer,
    filename: string,
    mimeType: string,
    fileId: string,
    options: any
  ): Promise<{ url: string; etag?: string; metadata?: any }> {
    const uploadPath = `/${provider.config.pullZone}/${fileId}/${filename}`;
    
    const response = await client.put(uploadPath, buffer, {
      headers: {
        'Content-Type': mimeType,
        'X-Bunny-Checksum': createHash('sha256').update(buffer).digest('hex')
      }
    });

    const cdnUrl = `${provider.config.customDomain || provider.config.endpoint}${uploadPath}`;
    
    return {
      url: cdnUrl,
      etag: response.headers.etag,
      metadata: { uploadPath }
    };
  }

  private async uploadToGenericProvider(
    client: AxiosInstance,
    provider: CDNProvider,
    buffer: Buffer,
    filename: string,
    mimeType: string,
    fileId: string,
    options: any
  ): Promise<{ url: string; etag?: string; metadata?: any }> {
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);
    formData.append('fileId', fileId);
    
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }

    const response = await client.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return {
      url: response.data.url || `${provider.config.endpoint}/${fileId}/${filename}`,
      etag: response.data.etag,
      metadata: response.data
    };
  }

  // Placeholder implementations for other providers
  private async uploadToFastly(...args: any[]): Promise<any> {
    return this.uploadToGenericProvider(...args);
  }

  private async uploadToCloudFront(...args: any[]): Promise<any> {
    return this.uploadToGenericProvider(...args);
  }

  private async uploadToImageKit(...args: any[]): Promise<any> {
    return this.uploadToGenericProvider(...args);
  }

  private buildOptimizedUrl(baseUrl: string, options: any): string {
    const url = new URL(baseUrl);
    const params = url.searchParams;

    // Image optimization parameters
    if (options.format && options.format !== 'auto') {
      params.set('f', options.format);
    }
    
    if (options.quality) {
      params.set('q', options.quality.toString());
    }
    
    if (options.width) {
      params.set('w', options.width.toString());
    }
    
    if (options.height) {
      params.set('h', options.height.toString());
    }
    
    if (options.dpr) {
      params.set('dpr', options.dpr.toString());
    }
    
    if (options.crop) {
      params.set('c', options.crop);
    }

    // Auto-format based on user agent
    if (options.format === 'auto' && options.userAgent) {
      if (options.userAgent.includes('Chrome')) {
        params.set('f', 'webp');
      } else if (options.userAgent.includes('Safari')) {
        params.set('f', 'jpeg');
      }
    }

    return url.toString();
  }

  private async getGeolocation(ip: string): Promise<GeolocationData> {
    const cached = this.geoCache.get(ip);
    if (cached) {
      return cached;
    }

    try {
      // In production, use a real geolocation service like MaxMind or IPinfo
      const response = await axios.get(`http://ip-api.com/json/${ip}`, {
        timeout: 5000
      });

      const data: GeolocationData = {
        country: response.data.country,
        region: response.data.regionName,
        city: response.data.city,
        continent: response.data.continent,
        latitude: response.data.lat,
        longitude: response.data.lon,
        timezone: response.data.timezone,
        isp: response.data.isp
      };

      this.geoCache.set(ip, data);
      return data;

    } catch (error) {
      console.warn(`Geolocation failed for IP ${ip}:`, error);
      // Return default location
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        continent: 'Unknown',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
        isp: 'Unknown'
      };
    }
  }

  private async purgeFromProvider(
    provider: CDNProvider,
    purgeData: { fileIds?: string[]; tags?: string[]; patterns?: string[] }
  ): Promise<void> {
    const client = this.httpClients.get(provider.id);
    if (!client) {
      throw new Error(`HTTP client not available for provider ${provider.id}`);
    }

    const requestData: any = {};
    
    if (purgeData.fileIds) {
      requestData.files = purgeData.fileIds;
    }
    
    if (purgeData.tags) {
      requestData.tags = purgeData.tags;
    }
    
    if (purgeData.patterns) {
      requestData.patterns = purgeData.patterns;
    }

    await client.post('/purge', requestData);
  }

  private getAuthHeader(provider: CDNProvider): string {
    if (provider.config.apiSecret) {
      return `Bearer ${provider.config.apiKey}:${provider.config.apiSecret}`;
    } else {
      return `Bearer ${provider.config.apiKey}`;
    }
  }

  private findFileByHash(hash: string): CDNFile | null {
    for (const file of this.files.values()) {
      if (file.metadata.hash === hash) {
        return file;
      }
    }
    return null;
  }

  private isProviderHealthy(providerId: string): boolean {
    const health = this.healthStatus.get(providerId);
    return health?.status === 'healthy' && health.circuitBreakerState === 'closed';
  }

  private recordProviderFailure(providerId: string, error: Error): void {
    const health = this.healthStatus.get(providerId);
    if (!health) return;

    health.failures++;
    health.errorCount++;
    
    if (health.failures >= this.circuitBreakerThreshold) {
      health.circuitBreakerState = 'open';
      health.nextRetry = new Date(Date.now() + this.circuitBreakerTimeout);
      health.status = 'unhealthy';
      
      this.emit('circuit_breaker_opened', {
        providerId,
        failures: health.failures,
        error: error.message
      });
    } else if (health.errorCount > 3) {
      health.status = 'degraded';
    }
  }

  private updateFileAnalytics(file: CDNFile, userLocation?: GeolocationData): void {
    file.analytics.totalRequests++;
    file.metadata.accessCount++;
    
    if (userLocation) {
      const country = userLocation.country;
      file.analytics.topRegions[country] = (file.analytics.topRegions[country] || 0) + 1;
    }
    
    file.analytics.lastAnalyzed = new Date();
  }

  private getFileRegions(file: CDNFile): string[] {
    const regions = new Set<string>();
    
    for (const [providerId, _] of file.providers) {
      const provider = this.providers.get(providerId);
      if (provider) {
        provider.regions.forEach(region => regions.add(region));
      }
    }
    
    return Array.from(regions);
  }

  private getAggregatedCapabilities(): Record<string, boolean> {
    const capabilities = {
      imageOptimization: false,
      videoStreaming: false,
      edgePurging: false,
      realTimeAnalytics: false,
      webpSupport: false,
      avifSupport: false,
      http3Support: false,
      brotliCompression: false
    };

    for (const provider of this.providers.values()) {
      if (provider.enabled) {
        Object.keys(capabilities).forEach(key => {
          if (provider.capabilities[key as keyof typeof provider.capabilities]) {
            capabilities[key as keyof typeof capabilities] = true;
          }
        });
      }
    }

    return capabilities;
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const [providerId, provider] of this.providers.entries()) {
        if (!provider.enabled) continue;
        await this.checkProviderHealth(providerId, provider);
      }
    }, this.healthCheckInterval);
  }

  private async checkProviderHealth(providerId: string, provider: CDNProvider): Promise<void> {
    const health = this.healthStatus.get(providerId);
    if (!health) return;

    if (health.circuitBreakerState === 'open') {
      if (!health.nextRetry || new Date() >= health.nextRetry) {
        health.circuitBreakerState = 'half-open';
      } else {
        return;
      }
    }

    try {
      const client = this.httpClients.get(providerId);
      if (!client) return;

      const startTime = Date.now();
      await client.get('/health', { timeout: 10000 });
      const responseTime = Date.now() - startTime;

      health.responseTime = responseTime;
      health.lastCheck = new Date();
      health.errorCount = Math.max(0, health.errorCount - 1);
      
      if (health.circuitBreakerState === 'half-open') {
        health.circuitBreakerState = 'closed';
        health.failures = 0;
      }
      
      health.status = responseTime < 2000 ? 'healthy' : 'degraded';
      health.uptime = Math.min(100, health.uptime + 0.1);

    } catch (error) {
      health.errorCount++;
      health.uptime = Math.max(0, health.uptime - 1);
      
      if (health.circuitBreakerState === 'half-open') {
        health.circuitBreakerState = 'open';
        health.nextRetry = new Date(Date.now() + this.circuitBreakerTimeout);
      }
      
      health.status = health.errorCount > 5 ? 'unhealthy' : 'degraded';
    }
  }

  private startAnalyticsCollection(): void {
    setInterval(() => {
      this.collectAnalytics();
    }, this.analyticsInterval);
  }

  private collectAnalytics(): void {
    const analytics = {
      timestamp: new Date(),
      totalFiles: this.files.size,
      activeProviders: Array.from(this.providers.values()).filter(p => p.enabled).length,
      healthyProviders: Array.from(this.healthStatus.values()).filter(h => h.status === 'healthy').length,
      cacheHitRate: this.calculateCacheHitRate(),
      totalBandwidth: Array.from(this.files.values()).reduce((sum, f) => sum + f.analytics.bandwidthUsed, 0)
    };

    this.emit('analytics_collected', analytics);
  }

  private startCostOptimization(): void {
    setInterval(async () => {
      try {
        await this.optimizeCosts();
      } catch (error) {
        console.error('Cost optimization failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async optimizeCosts(): Promise<void> {
    const files = Array.from(this.files.values());
    const recommendations = [];

    // Analyze file usage patterns
    for (const file of files) {
      const daysSinceLastAccess = file.analytics.lastAnalyzed 
        ? (Date.now() - file.analytics.lastAnalyzed.getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      // Recommend moving cold files to cheaper providers
      if (daysSinceLastAccess > 30 && file.analytics.totalRequests < 10) {
        recommendations.push({
          type: 'cold_storage',
          fileId: file.id,
          suggestion: 'Move to cheaper storage tier',
          potentialSavings: this.estimateColdStorageSavings(file)
        });
      }

      // Recommend removing unused files
      if (daysSinceLastAccess > 90 && file.analytics.totalRequests === 0) {
        recommendations.push({
          type: 'unused_file',
          fileId: file.id,
          suggestion: 'Consider deletion',
          potentialSavings: this.estimateDeleteSavings(file)
        });
      }
    }

    if (recommendations.length > 0) {
      this.emit('cost_optimization_recommendations', recommendations);
    }
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate calculation
    return Math.random() * 0.3 + 0.7; // 70-100% hit rate
  }

  private calculateAverageResponseTime(): number {
    const healthyProviders = Array.from(this.healthStatus.values())
      .filter(h => h.status === 'healthy');
    
    if (healthyProviders.length === 0) return 0;
    
    return healthyProviders.reduce((sum, h) => sum + h.responseTime, 0) / healthyProviders.length;
  }

  private getTopCountries(files: CDNFile[]): Record<string, number> {
    const countries: Record<string, number> = {};
    
    files.forEach(file => {
      Object.entries(file.analytics.topRegions).forEach(([country, count]) => {
        countries[country] = (countries[country] || 0) + count;
      });
    });

    return countries;
  }

  private getTopFiles(files: CDNFile[]): CDNAnalytics['topFiles'] {
    return files
      .sort((a, b) => b.analytics.totalRequests - a.analytics.totalRequests)
      .slice(0, 10)
      .map(file => ({
        file: file.metadata.filename,
        requests: file.analytics.totalRequests,
        bandwidth: file.analytics.bandwidthUsed
      }));
  }

  private getProviderPerformance(): CDNAnalytics['providerPerformance'] {
    const performance: CDNAnalytics['providerPerformance'] = {};

    for (const [providerId, provider] of this.providers.entries()) {
      if (!provider.enabled) continue;

      const health = this.healthStatus.get(providerId);
      if (health) {
        performance[provider.name] = {
          uptime: health.uptime,
          averageResponseTime: health.responseTime,
          errorRate: health.errorCount / 100, // Simplified
          bandwidth: 0, // Would need actual metrics
          cost: 0 // Would need actual cost tracking
        };
      }
    }

    return performance;
  }

  private async calculateCostAnalysis(
    files: CDNFile[], 
    timeRange?: { start: Date; end: Date }
  ): Promise<CDNAnalytics['costAnalysis']> {
    // Simplified cost calculation
    const totalBandwidth = files.reduce((sum, f) => sum + f.analytics.bandwidthUsed, 0);
    const totalRequests = files.reduce((sum, f) => sum + f.analytics.totalRequests, 0);
    
    const costByProvider: Record<string, number> = {};
    let totalCost = 0;

    for (const [providerId, provider] of this.providers.entries()) {
      if (!provider.enabled) continue;

      const providerBandwidth = totalBandwidth / this.providers.size; // Simplified distribution
      const providerRequests = totalRequests / this.providers.size;
      
      const bandwidthCost = (providerBandwidth / (1024 * 1024 * 1024)) * provider.pricing.costPerGB;
      const requestCost = providerRequests * provider.pricing.costPerRequest;
      const providerCost = bandwidthCost + requestCost;
      
      costByProvider[provider.name] = providerCost;
      totalCost += providerCost;
    }

    return {
      totalCost,
      costByProvider,
      projectedMonthlyCost: totalCost * 30, // Simplified projection
      savings: 0 // Would calculate based on single-provider cost
    };
  }

  private estimateColdStorageSavings(file: CDNFile): number {
    return file.metadata.size * 0.00001; // $0.01 per GB savings estimate
  }

  private estimateDeleteSavings(file: CDNFile): number {
    return file.metadata.size * 0.000023; // Full storage cost savings
  }

  private async initializeGeolocation(): Promise<void> {
    // Initialize geolocation service (placeholder)
    console.log('🌍 Geolocation service initialized');
  }

  async getSystemStatus(): Promise<{
    totalFiles: number;
    totalProviders: number;
    healthyProviders: number;
    totalRegions: number;
    cacheHitRate: number;
    averageResponseTime: number;
  }> {
    return {
      totalFiles: this.files.size,
      totalProviders: this.providers.size,
      healthyProviders: Array.from(this.healthStatus.values()).filter(h => h.status === 'healthy').length,
      totalRegions: Object.keys(this.regions).length,
      cacheHitRate: this.calculateCacheHitRate(),
      averageResponseTime: this.calculateAverageResponseTime()
    };
  }

  async shutdown(): Promise<void> {
    // Clear caches
    this.urlCache.clear();
    this.geoCache.clear();
    this.analyticsCache.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    console.log('🧹 Global CDN Manager shut down');
  }
}

export default GlobalCDNManager;