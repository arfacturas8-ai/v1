import { EventEmitter } from 'events';
import { Logger } from 'pino';
import { Redis } from 'ioredis';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;
  recoveryTimeout: number;
  timeout: number;
  monitoringWindow: number;
  minimumRequests: number;
  successThreshold?: number;
  volumeThreshold?: number;
  errorThresholdPercentage?: number;
  enableCache?: boolean;
  cacheTTL?: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  timeout: number;
  nextAttempt: number;
  totalRequests: number;
  errorRate: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  stateHistory: Array<{ state: CircuitState; timestamp: number; reason: string }>;
}

export interface CircuitBreakerMetrics {
  name: string;
  state: CircuitState;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeouts: number;
  circuitOpenings: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  lastFailure?: {
    timestamp: number;
    error: string;
  };
}

export class CircuitBreaker<T = any, R = any> extends EventEmitter {
  private config: CircuitBreakerConfig;
  private logger: Logger;
  private redis?: Redis;
  
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = 0;
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private timeouts = 0;
  private circuitOpenings = 0;
  private responseTimes: number[] = [];
  private recentErrors: Array<{ timestamp: number; error: string }> = [];
  private stateHistory: Array<{ state: CircuitState; timestamp: number; reason: string }> = [];
  
  private requestWindow: Array<{ timestamp: number; success: boolean; responseTime: number }> = [];
  private cache = new Map<string, { value: R; expiry: number }>();

  constructor(
    private action: (args: T) => Promise<R>,
    config: Partial<CircuitBreakerConfig> = {},
    logger: Logger,
    redis?: Redis
  ) {
    super();
    
    this.config = {
      name: 'circuit-breaker',
      failureThreshold: 5,
      recoveryTimeout: 60000,
      timeout: 30000,
      monitoringWindow: 60000,
      minimumRequests: 10,
      successThreshold: 3,
      volumeThreshold: 20,
      errorThresholdPercentage: 50,
      enableCache: false,
      cacheTTL: 300000,
      ...config,
    };
    
    this.logger = logger;
    this.redis = redis;
    
    this.addToStateHistory('CLOSED', 'Initial state');
    this.startMetricsCollection();
  }

  public async execute(args: T, cacheKey?: string): Promise<R> {
    this.totalRequests++;
    
    // Check cache first if enabled
    if (this.config.enableCache && cacheKey) {
      const cached = this.getCachedResult(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        this.emit('circuit:rejected', { name: this.config.name, args });
        throw new Error(`Circuit breaker is OPEN. Next attempt allowed at ${new Date(this.nextAttempt)}`);
      }
      
      // Try to move to half-open state
      this.changeState('HALF_OPEN', 'Recovery timeout elapsed');
    }

    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Circuit breaker timeout after ${this.config.timeout}ms`));
        }, this.config.timeout);
      });

      // Execute action with timeout
      const result = await Promise.race([
        this.action(args),
        timeoutPromise
      ]);

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      // Cache result if enabled
      if (this.config.enableCache && cacheKey && result) {
        this.setCachedResult(cacheKey, result);
      }

      this.emit('circuit:success', { 
        name: this.config.name, 
        args, 
        result, 
        responseTime 
      });

      return result;

    } catch (error) {
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const responseTime = Date.now() - startTime;
      this.recordFailure(error, responseTime);

      this.emit('circuit:failure', { 
        name: this.config.name, 
        args, 
        error, 
        responseTime 
      });

      throw error;
    }
  }

  private recordSuccess(responseTime: number): void {
    this.successCount++;
    this.successfulRequests++;
    this.responseTimes.push(responseTime);
    
    // Limit response times array size
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    this.addToRequestWindow(true, responseTime);

    // Reset failure count on success
    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= (this.config.successThreshold || 3)) {
        this.changeState('CLOSED', 'Successful requests threshold reached');
        this.resetCounts();
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0;
    }

    this.saveMetricsToRedis();
  }

  private recordFailure(error: any, responseTime: number): void {
    this.failureCount++;
    this.failedRequests++;

    // Record error details
    const errorInfo = {
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : String(error),
    };
    
    this.recentErrors.push(errorInfo);
    
    // Limit error history
    if (this.recentErrors.length > 100) {
      this.recentErrors = this.recentErrors.slice(-100);
    }

    // Check for timeout
    if (error.message?.includes('timeout')) {
      this.timeouts++;
    }

    this.addToRequestWindow(false, responseTime);

    // Check if circuit should open
    if (this.shouldOpenCircuit()) {
      this.openCircuit('Failure threshold exceeded');
    }

    this.saveMetricsToRedis();
  }

  private shouldOpenCircuit(): boolean {
    if (this.state === 'OPEN') {
      return false;
    }

    // Check minimum request threshold
    if (this.totalRequests < this.config.minimumRequests) {
      return false;
    }

    // Check failure threshold (simple count)
    if (this.failureCount >= this.config.failureThreshold) {
      return true;
    }

    // Check error rate in monitoring window
    const windowStart = Date.now() - this.config.monitoringWindow;
    const windowRequests = this.requestWindow.filter(r => r.timestamp >= windowStart);
    
    if (windowRequests.length >= (this.config.volumeThreshold || 20)) {
      const failures = windowRequests.filter(r => !r.success).length;
      const errorRate = (failures / windowRequests.length) * 100;
      
      if (errorRate >= (this.config.errorThresholdPercentage || 50)) {
        return true;
      }
    }

    return false;
  }

  private openCircuit(reason: string): void {
    this.changeState('OPEN', reason);
    this.nextAttempt = Date.now() + this.config.recoveryTimeout;
    this.circuitOpenings++;
    
    this.logger.warn({
      circuitName: this.config.name,
      reason,
      failureCount: this.failureCount,
      nextAttempt: new Date(this.nextAttempt),
    }, 'Circuit breaker opened');
  }

  private changeState(newState: CircuitState, reason: string): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      
      this.addToStateHistory(newState, reason);
      
      this.logger.info({
        circuitName: this.config.name,
        oldState,
        newState,
        reason,
      }, 'Circuit breaker state changed');

      this.emit('circuit:state-change', {
        name: this.config.name,
        oldState,
        newState,
        reason,
        timestamp: Date.now(),
      });
    }
  }

  private resetCounts(): void {
    this.failureCount = 0;
    this.successCount = 0;
  }

  private addToRequestWindow(success: boolean, responseTime: number): void {
    this.requestWindow.push({
      timestamp: Date.now(),
      success,
      responseTime,
    });

    // Clean old entries outside monitoring window
    const windowStart = Date.now() - this.config.monitoringWindow;
    this.requestWindow = this.requestWindow.filter(r => r.timestamp >= windowStart);
  }

  private addToStateHistory(state: CircuitState, reason: string): void {
    this.stateHistory.push({
      state,
      timestamp: Date.now(),
      reason,
    });

    // Limit history size
    if (this.stateHistory.length > 100) {
      this.stateHistory = this.stateHistory.slice(-100);
    }
  }

  private getCachedResult(key: string): R | null {
    if (!this.config.enableCache) {
      return null;
    }

    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  private setCachedResult(key: string, value: R): void {
    if (!this.config.enableCache) {
      return;
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + (this.config.cacheTTL || 300000),
    });

    // Limit cache size
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);
  }

  private collectMetrics(): void {
    const metrics = this.getMetrics();
    
    this.emit('circuit:metrics', {
      name: this.config.name,
      metrics,
      timestamp: Date.now(),
    });

    // Log health status
    if (this.state === 'OPEN' || metrics.errorRate > 25) {
      this.logger.warn({
        circuitName: this.config.name,
        state: this.state,
        errorRate: metrics.errorRate,
        failureCount: this.failureCount,
      }, 'Circuit breaker health warning');
    }
  }

  private async saveMetricsToRedis(): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const metrics = this.getMetrics();
      const key = `circuit-breaker:${this.config.name}:metrics`;
      
      await this.redis.set(
        key,
        JSON.stringify(metrics),
        'EX',
        300 // 5 minutes
      );

      // Also store in time series for trending
      const timeSeriesKey = `circuit-breaker:${this.config.name}:timeseries`;
      await this.redis.zadd(
        timeSeriesKey,
        Date.now(),
        JSON.stringify({
          timestamp: Date.now(),
          state: this.state,
          errorRate: metrics.errorRate,
          totalRequests: this.totalRequests,
          responseTime: metrics.averageResponseTime,
        })
      );

      // Keep only last 24 hours of time series data
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      await this.redis.zremrangebyscore(timeSeriesKey, 0, dayAgo);

    } catch (error) {
      this.logger.warn({
        error,
        circuitName: this.config.name,
      }, 'Failed to save circuit breaker metrics to Redis');
    }
  }

  public getStats(): CircuitBreakerStats {
    const windowStart = Date.now() - this.config.monitoringWindow;
    const windowRequests = this.requestWindow.filter(r => r.timestamp >= windowStart);
    const failures = windowRequests.filter(r => !r.success).length;
    const errorRate = windowRequests.length > 0 ? (failures / windowRequests.length) * 100 : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      timeout: this.config.timeout,
      nextAttempt: this.nextAttempt,
      totalRequests: this.totalRequests,
      errorRate,
      lastFailureTime: this.recentErrors.length > 0 ? this.recentErrors[this.recentErrors.length - 1].timestamp : undefined,
      lastSuccessTime: undefined, // Would need to track this separately
      stateHistory: [...this.stateHistory],
    };
  }

  public getMetrics(): CircuitBreakerMetrics {
    const windowStart = Date.now() - this.config.monitoringWindow;
    const windowRequests = this.requestWindow.filter(r => r.timestamp >= windowStart);
    const failures = windowRequests.filter(r => !r.success).length;
    const errorRate = windowRequests.length > 0 ? (failures / windowRequests.length) * 100 : 0;
    
    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;

    const uptime = this.stateHistory.length > 0 
      ? Date.now() - this.stateHistory[0].timestamp
      : 0;

    return {
      name: this.config.name,
      state: this.state,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      timeouts: this.timeouts,
      circuitOpenings: this.circuitOpenings,
      averageResponseTime,
      errorRate,
      uptime,
      lastFailure: this.recentErrors.length > 0 ? this.recentErrors[this.recentErrors.length - 1] : undefined,
    };
  }

  public async getTimeSeriesData(hours: number = 24): Promise<any[]> {
    if (!this.redis) {
      return [];
    }

    try {
      const key = `circuit-breaker:${this.config.name}:timeseries`;
      const since = Date.now() - (hours * 60 * 60 * 1000);
      
      const data = await this.redis.zrangebyscore(key, since, '+inf', 'WITHSCORES');
      const result = [];
      
      for (let i = 0; i < data.length; i += 2) {
        const value = JSON.parse(data[i]);
        const score = parseInt(data[i + 1]);
        result.push({ ...value, timestamp: score });
      }
      
      return result;
    } catch (error) {
      this.logger.warn({
        error,
        circuitName: this.config.name,
      }, 'Failed to get time series data');
      return [];
    }
  }

  public reset(): void {
    this.changeState('CLOSED', 'Manual reset');
    this.resetCounts();
    this.nextAttempt = 0;
    this.requestWindow = [];
    this.cache.clear();
    
    this.logger.info({
      circuitName: this.config.name,
    }, 'Circuit breaker manually reset');
  }

  public forceOpen(reason: string = 'Manual force open'): void {
    this.openCircuit(reason);
    
    this.logger.warn({
      circuitName: this.config.name,
      reason,
    }, 'Circuit breaker manually opened');
  }

  public updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.logger.info({
      circuitName: this.config.name,
      newConfig,
    }, 'Circuit breaker configuration updated');
  }

  public getName(): string {
    return this.config.name;
  }

  public getState(): CircuitState {
    return this.state;
  }

  public isHealthy(): boolean {
    if (this.state === 'OPEN') {
      return false;
    }

    const stats = this.getStats();
    return stats.errorRate < 10; // Consider healthy if error rate < 10%
  }
}

export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers = new Map<string, CircuitBreaker>();
  private logger: Logger;
  private redis?: Redis;

  private constructor(logger: Logger, redis?: Redis) {
    this.logger = logger;
    this.redis = redis;
  }

  public static getInstance(logger: Logger, redis?: Redis): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry(logger, redis);
    }
    return CircuitBreakerRegistry.instance;
  }

  public register<T, R>(
    name: string,
    action: (args: T) => Promise<R>,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker<T, R> {
    if (this.breakers.has(name)) {
      throw new Error(`Circuit breaker with name '${name}' already registered`);
    }

    const breaker = new CircuitBreaker(
      action,
      { ...config, name },
      this.logger,
      this.redis
    );

    this.breakers.set(name, breaker);
    
    this.logger.info({
      circuitName: name,
      config,
    }, 'Circuit breaker registered');

    return breaker;
  }

  public get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  public remove(name: string): boolean {
    const removed = this.breakers.delete(name);
    if (removed) {
      this.logger.info({ circuitName: name }, 'Circuit breaker removed');
    }
    return removed;
  }

  public list(): string[] {
    return Array.from(this.breakers.keys());
  }

  public getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }

  public getHealthySystems(): string[] {
    return Array.from(this.breakers.entries())
      .filter(([_, breaker]) => breaker.isHealthy())
      .map(([name]) => name);
  }

  public getUnhealthySystems(): string[] {
    return Array.from(this.breakers.entries())
      .filter(([_, breaker]) => !breaker.isHealthy())
      .map(([name]) => name);
  }

  public resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    
    this.logger.info('All circuit breakers reset');
  }
}

export default CircuitBreaker;