export interface ServerEndpoint {
  id: string;
  url: string;
  region: string;
  priority: number; // Lower number = higher priority
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  latency: number; // ms
  lastCheck: number;
  maxRetries: number;
  currentRetries: number;
  capabilities: {
    audio: boolean;
    video: boolean;
    screenShare: boolean;
    recording: boolean;
  };
  metadata: {
    version?: string;
    maxParticipants?: number;
    load?: number; // 0-100
  };
}

export interface HealthCheckResult {
  endpointId: string;
  success: boolean;
  latency: number;
  error?: string;
  capabilities?: ServerEndpoint['capabilities'];
  metadata?: ServerEndpoint['metadata'];
}

export interface FallbackEvent {
  type: 'server_down' | 'server_degraded' | 'server_restored' | 'fallback_activated' | 'no_servers_available';
  primaryServer: string;
  fallbackServer?: string;
  timestamp: number;
  reason: string;
}

export class ServerFallbackManager {
  private endpoints: Map<string, ServerEndpoint> = new Map();
  private currentEndpoint: ServerEndpoint | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;
  
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly CONNECTION_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly DEGRADED_LATENCY_THRESHOLD = 200; // ms
  private readonly OFFLINE_LATENCY_THRESHOLD = 5000; // ms
  
  private eventHandlers: Map<string, Function[]> = new Map();
  private fallbackHistory: FallbackEvent[] = [];
  private readonly MAX_HISTORY = 50;

  constructor() {
    this.initializeDefaultEndpoints();
    this.startHealthChecking();
  }

  private initializeDefaultEndpoints(): void {
    // Primary server (from environment)
    const primaryUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://localhost:7880';
    this.addEndpoint({
      id: 'primary',
      url: primaryUrl,
      region: 'local',
      priority: 1,
      status: 'unknown',
      latency: 0,
      lastCheck: 0,
      maxRetries: this.MAX_RETRIES,
      currentRetries: 0,
      capabilities: {
        audio: true,
        video: true,
        screenShare: true,
        recording: false
      },
      metadata: {}
    });

    // Add backup servers if configured
    const backupUrls = process.env.NEXT_PUBLIC_LIVEKIT_BACKUP_URLS?.split(',') || [];
    backupUrls.forEach((url, index) => {
      this.addEndpoint({
        id: `backup-${index}`,
        url: url.trim(),
        region: 'backup',
        priority: 10 + index,
        status: 'unknown',
        latency: 0,
        lastCheck: 0,
        maxRetries: this.MAX_RETRIES,
        currentRetries: 0,
        capabilities: {
          audio: true,
          video: true,
          screenShare: false,
          recording: false
        },
        metadata: {}
      });
    });

    console.log(`Initialized ${this.endpoints.size} LiveKit endpoints`);
  }

  public addEndpoint(endpoint: ServerEndpoint): void {
    this.endpoints.set(endpoint.id, endpoint);
    console.log(`Added endpoint: ${endpoint.id} (${endpoint.url})`);
  }

  public removeEndpoint(endpointId: string): void {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      this.endpoints.delete(endpointId);
      
      // If this was the current endpoint, select a new one
      if (this.currentEndpoint?.id === endpointId) {
        this.selectBestEndpoint();
      }
      
      console.log(`Removed endpoint: ${endpointId}`);
    }
  }

  public async getCurrentEndpoint(): Promise<ServerEndpoint> {
    if (!this.currentEndpoint) {
      await this.selectBestEndpoint();
    }
    
    if (!this.currentEndpoint) {
      throw new Error('No available LiveKit servers');
    }
    
    return this.currentEndpoint;
  }

  public async selectBestEndpoint(): Promise<ServerEndpoint | null> {
    const availableEndpoints = Array.from(this.endpoints.values())
      .filter(endpoint => endpoint.status === 'online' || endpoint.status === 'unknown')
      .sort((a, b) => {
        // First sort by priority
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Then by latency
        return a.latency - b.latency;
      });

    if (availableEndpoints.length === 0) {
      console.error('No available LiveKit endpoints');
      this.emitEvent({
        type: 'no_servers_available',
        primaryServer: this.currentEndpoint?.id || 'unknown',
        timestamp: Date.now(),
        reason: 'All servers are offline or failed health checks'
      });
      this.currentEndpoint = null;
      return null;
    }

    const bestEndpoint = availableEndpoints[0];
    const previousEndpoint = this.currentEndpoint;
    
    if (!previousEndpoint || previousEndpoint.id !== bestEndpoint.id) {
      console.log(`Selected endpoint: ${bestEndpoint.id} (${bestEndpoint.url})`);
      this.currentEndpoint = bestEndpoint;
      
      if (previousEndpoint) {
        this.emitEvent({
          type: 'fallback_activated',
          primaryServer: previousEndpoint.id,
          fallbackServer: bestEndpoint.id,
          timestamp: Date.now(),
          reason: 'Endpoint changed due to health check results'
        });
      }
    }
    
    return bestEndpoint;
  }

  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);

    // Initial health check
    setTimeout(() => this.performHealthChecks(), 1000);
  }

  private async performHealthChecks(): Promise<void> {
    if (this.isDestroyed) return;

    const endpoints = Array.from(this.endpoints.values());
    const healthCheckPromises = endpoints.map(endpoint => 
      this.checkEndpointHealth(endpoint)
    );

    try {
      const results = await Promise.allSettled(healthCheckPromises);
      
      results.forEach((result, index) => {
        const endpoint = endpoints[index];
        
        if (result.status === 'fulfilled' && result.value) {
          this.updateEndpointStatus(endpoint, result.value);
        } else {
          // Health check failed
          this.handleHealthCheckFailure(endpoint, 
            result.status === 'rejected' ? result.reason : 'Health check timeout'
          );
        }
      });

      // Select best endpoint if current one is unhealthy
      if (this.currentEndpoint && this.currentEndpoint.status !== 'online') {
        await this.selectBestEndpoint();
      }

    } catch (error) {
      console.error('Error performing health checks:', error);
    }
  }

  private async checkEndpointHealth(endpoint: ServerEndpoint): Promise<HealthCheckResult | null> {
    const startTime = Date.now();
    
    try {
      // Create a test WebSocket connection
      const healthCheckPromise = new Promise<HealthCheckResult>((resolve, reject) => {
        const ws = new WebSocket(endpoint.url.replace('wss://', 'ws://').replace('ws://', 'ws://') + '/_health');
        let resolved = false;
        
        const cleanup = () => {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        };
        
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(new Error('Health check timeout'));
          }
        }, this.CONNECTION_TIMEOUT);
        
        ws.onopen = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve({
              endpointId: endpoint.id,
              success: true,
              latency: Date.now() - startTime
            });
          }
        };
        
        ws.onerror = (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            cleanup();
            reject(error);
          }
        };
        
        ws.onclose = (event) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            if (event.code === 1000) {
              // Normal closure
              resolve({
                endpointId: endpoint.id,
                success: true,
                latency: Date.now() - startTime
              });
            } else {
              reject(new Error(`WebSocket closed with code ${event.code}`));
            }
          }
        };
      });

      return await healthCheckPromise;
      
    } catch (error) {
      return {
        endpointId: endpoint.id,
        success: false,
        latency: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private updateEndpointStatus(endpoint: ServerEndpoint, result: HealthCheckResult): void {
    const previousStatus = endpoint.status;
    endpoint.latency = result.latency;
    endpoint.lastCheck = Date.now();
    endpoint.currentRetries = 0; // Reset retry count on successful check
    
    // Determine new status based on latency
    if (result.success) {
      if (result.latency < this.DEGRADED_LATENCY_THRESHOLD) {
        endpoint.status = 'online';
      } else if (result.latency < this.OFFLINE_LATENCY_THRESHOLD) {
        endpoint.status = 'degraded';
      } else {
        endpoint.status = 'offline';
      }
    } else {
      endpoint.status = 'offline';
    }

    // Update capabilities and metadata if provided
    if (result.capabilities) {
      endpoint.capabilities = result.capabilities;
    }
    if (result.metadata) {
      endpoint.metadata = result.metadata;
    }

    // Emit events for status changes
    if (previousStatus !== endpoint.status) {
      console.log(`Endpoint ${endpoint.id} status changed: ${previousStatus} -> ${endpoint.status}`);
      
      if (endpoint.status === 'offline' && previousStatus === 'online') {
        this.emitEvent({
          type: 'server_down',
          primaryServer: endpoint.id,
          timestamp: Date.now(),
          reason: `Health check failed: ${result.error || 'High latency'}`
        });
      } else if (endpoint.status === 'degraded' && previousStatus === 'online') {
        this.emitEvent({
          type: 'server_degraded',
          primaryServer: endpoint.id,
          timestamp: Date.now(),
          reason: `High latency detected: ${result.latency}ms`
        });
      } else if (endpoint.status === 'online' && previousStatus !== 'online') {
        this.emitEvent({
          type: 'server_restored',
          primaryServer: endpoint.id,
          timestamp: Date.now(),
          reason: `Health check passed: ${result.latency}ms latency`
        });
      }
    }
  }

  private handleHealthCheckFailure(endpoint: ServerEndpoint, error: string): void {
    endpoint.currentRetries++;
    endpoint.lastCheck = Date.now();
    
    if (endpoint.currentRetries >= endpoint.maxRetries) {
      const previousStatus = endpoint.status;
      endpoint.status = 'offline';
      
      if (previousStatus !== 'offline') {
        console.error(`Endpoint ${endpoint.id} marked offline after ${endpoint.maxRetries} failed attempts`);
        this.emitEvent({
          type: 'server_down',
          primaryServer: endpoint.id,
          timestamp: Date.now(),
          reason: `Health check failed ${endpoint.maxRetries} times: ${error}`
        });
      }
    } else {
      console.warn(`Health check failed for ${endpoint.id} (attempt ${endpoint.currentRetries}/${endpoint.maxRetries}): ${error}`);
    }
  }

  public async testConnection(endpointId?: string): Promise<boolean> {
    const endpoint = endpointId 
      ? this.endpoints.get(endpointId)
      : await this.getCurrentEndpoint();
      
    if (!endpoint) {
      return false;
    }

    try {
      const result = await this.checkEndpointHealth(endpoint);
      return result?.success || false;
    } catch (error) {
      console.error(`Connection test failed for ${endpoint.id}:`, error);
      return false;
    }
  }

  public getEndpointStatus(): ServerEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  public getHealthyEndpoints(): ServerEndpoint[] {
    return Array.from(this.endpoints.values())
      .filter(endpoint => endpoint.status === 'online' || endpoint.status === 'degraded')
      .sort((a, b) => a.priority - b.priority);
  }

  public async forceFailover(targetEndpointId?: string): Promise<ServerEndpoint | null> {
    console.log('Forcing failover...');
    
    if (targetEndpointId) {
      const targetEndpoint = this.endpoints.get(targetEndpointId);
      if (targetEndpoint) {
        this.currentEndpoint = targetEndpoint;
        console.log(`Forced failover to: ${targetEndpointId}`);
        return targetEndpoint;
      }
    }
    
    return await this.selectBestEndpoint();
  }

  public getConnectionUrl(): string {
    if (!this.currentEndpoint) {
      throw new Error('No current endpoint selected');
    }
    return this.currentEndpoint.url;
  }

  public getConnectionCapabilities(): ServerEndpoint['capabilities'] {
    if (!this.currentEndpoint) {
      return {
        audio: false,
        video: false,
        screenShare: false,
        recording: false
      };
    }
    return this.currentEndpoint.capabilities;
  }

  private emitEvent(event: FallbackEvent): void {
    this.fallbackHistory.push(event);
    if (this.fallbackHistory.length > this.MAX_HISTORY) {
      this.fallbackHistory.shift();
    }
    
    this.emit('fallbackEvent', event);
  }

  public getFallbackHistory(): FallbackEvent[] {
    return [...this.fallbackHistory];
  }

  public getStatistics(): {
    totalEndpoints: number;
    onlineEndpoints: number;
    degradedEndpoints: number;
    offlineEndpoints: number;
    currentEndpoint: string | null;
    averageLatency: number;
    totalFailovers: number;
  } {
    const endpoints = Array.from(this.endpoints.values());
    const onlineCount = endpoints.filter(e => e.status === 'online').length;
    const degradedCount = endpoints.filter(e => e.status === 'degraded').length;
    const offlineCount = endpoints.filter(e => e.status === 'offline').length;
    
    const avgLatency = endpoints.length > 0 
      ? endpoints.reduce((sum, e) => sum + e.latency, 0) / endpoints.length 
      : 0;
      
    const failoverCount = this.fallbackHistory.filter(e => e.type === 'fallback_activated').length;
    
    return {
      totalEndpoints: endpoints.length,
      onlineEndpoints: onlineCount,
      degradedEndpoints: degradedCount,
      offlineEndpoints: offlineCount,
      currentEndpoint: this.currentEndpoint?.id || null,
      averageLatency: avgLatency,
      totalFailovers: failoverCount
    };
  }

  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in fallback manager event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    this.endpoints.clear();
    this.fallbackHistory = [];
    this.eventHandlers.clear();
    this.currentEndpoint = null;
    
    console.log('ServerFallbackManager destroyed');
  }
}