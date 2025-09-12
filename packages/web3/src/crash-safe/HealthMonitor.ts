import { connectionManager } from './ConnectionManager';
import { walletConnectionManager } from './WalletConnectionManager';
import { transactionManager } from './TransactionManager';
import { sessionManager } from './SessionManager';

export interface HealthMetrics {
  timestamp: number;
  
  // RPC Health
  rpcHealth: Record<number, {
    chainId: number;
    chainName: string;
    totalEndpoints: number;
    healthyEndpoints: number;
    averageResponseTime: number;
    successRate: number;
    lastError?: string;
    status: 'healthy' | 'degraded' | 'critical';
  }>;
  
  // Wallet Connection Health
  walletHealth: {
    isConnected: boolean;
    provider?: string;
    chainId?: number;
    lastConnectionTime?: number;
    connectionErrors: number;
    reconnectionAttempts: number;
    status: 'connected' | 'connecting' | 'disconnected' | 'error';
  };
  
  // Transaction Health
  transactionHealth: {
    pendingCount: number;
    successRate: number;
    averageConfirmationTime: number;
    failureRate: number;
    gasEfficiency: number;
    recentErrors: string[];
    status: 'healthy' | 'congested' | 'failing';
  };
  
  // Session Health
  sessionHealth: {
    activeSessions: number;
    authenticatedSessions: number;
    averageSessionDuration: number;
    sessionErrors: number;
    reconnectionRate: number;
    status: 'healthy' | 'degraded' | 'critical';
  };
  
  // Overall Health Score (0-100)
  overallHealthScore: number;
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'offline';
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: HealthMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // ms
  lastTriggered: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreaker {
  id: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  config: CircuitBreakerConfig;
}

export interface HealthMonitorConfig {
  checkInterval: number;
  metricsRetentionPeriod: number;
  alertCooldown: number;
  enableCircuitBreakers: boolean;
  enableAutoRecovery: boolean;
  thresholds: {
    rpcResponseTime: number;
    transactionFailureRate: number;
    sessionFailureRate: number;
    overallHealthScore: number;
  };
}

export interface HealthAlert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  metrics: HealthMetrics;
  resolved: boolean;
  resolvedAt?: number;
}

export class CrashSafeHealthMonitor {
  private metricsHistory: HealthMetrics[] = [];
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private alerts: HealthAlert[] = [];
  private alertRules: AlertRule[] = [];
  private monitoringTimer: NodeJS.Timeout | null = null;
  private listeners = new Map<string, Function[]>();
  private logger = console;

  private readonly config: HealthMonitorConfig = {
    checkInterval: 30000, // 30 seconds
    metricsRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
    alertCooldown: 5 * 60 * 1000, // 5 minutes
    enableCircuitBreakers: true,
    enableAutoRecovery: true,
    thresholds: {
      rpcResponseTime: 5000, // 5 seconds
      transactionFailureRate: 0.1, // 10%
      sessionFailureRate: 0.05, // 5%
      overallHealthScore: 70
    }
  };

  constructor(config?: Partial<HealthMonitorConfig>) {
    this.config = { ...this.config, ...config };
    this.initializeAlertRules();
    this.initializeCircuitBreakers();
    this.startMonitoring();
  }

  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'rpc_critical_failure',
        name: 'RPC Critical Failure',
        description: 'All RPC endpoints for a chain are failing',
        condition: (metrics) => 
          Object.values(metrics.rpcHealth).some(rpc => rpc.status === 'critical'),
        severity: 'critical',
        enabled: true,
        cooldown: this.config.alertCooldown,
        lastTriggered: 0
      },
      {
        id: 'transaction_high_failure_rate',
        name: 'High Transaction Failure Rate',
        description: 'Transaction failure rate exceeds threshold',
        condition: (metrics) => 
          metrics.transactionHealth.failureRate > this.config.thresholds.transactionFailureRate,
        severity: 'high',
        enabled: true,
        cooldown: this.config.alertCooldown,
        lastTriggered: 0
      },
      {
        id: 'wallet_connection_lost',
        name: 'Wallet Connection Lost',
        description: 'Wallet connection has been lost',
        condition: (metrics) => 
          metrics.walletHealth.status === 'error' && metrics.walletHealth.connectionErrors > 3,
        severity: 'medium',
        enabled: true,
        cooldown: this.config.alertCooldown,
        lastTriggered: 0
      },
      {
        id: 'session_high_failure_rate',
        name: 'High Session Failure Rate',
        description: 'Session failure rate exceeds threshold',
        condition: (metrics) => 
          metrics.sessionHealth.sessionErrors > 0 && 
          (metrics.sessionHealth.sessionErrors / Math.max(metrics.sessionHealth.activeSessions, 1)) > this.config.thresholds.sessionFailureRate,
        severity: 'medium',
        enabled: true,
        cooldown: this.config.alertCooldown,
        lastTriggered: 0
      },
      {
        id: 'overall_health_degraded',
        name: 'Overall Health Degraded',
        description: 'Overall health score is below threshold',
        condition: (metrics) => 
          metrics.overallHealthScore < this.config.thresholds.overallHealthScore,
        severity: 'low',
        enabled: true,
        cooldown: this.config.alertCooldown * 2, // Longer cooldown for general alerts
        lastTriggered: 0
      }
    ];
  }

  private initializeCircuitBreakers(): void {
    if (!this.config.enableCircuitBreakers) return;

    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000, // 1 minute
      monitoringPeriod: 300000 // 5 minutes
    };

    // RPC Circuit Breakers
    const supportedChains = connectionManager.getSupportedChains();
    for (const chain of supportedChains) {
      this.createCircuitBreaker(`rpc_${chain.id}`, defaultConfig);
    }

    // Wallet Circuit Breaker
    this.createCircuitBreaker('wallet_connection', {
      ...defaultConfig,
      failureThreshold: 3,
      timeout: 30000 // 30 seconds for wallet issues
    });

    // Transaction Circuit Breaker
    this.createCircuitBreaker('transactions', {
      ...defaultConfig,
      failureThreshold: 10,
      timeout: 120000 // 2 minutes for transaction issues
    });
  }

  private createCircuitBreaker(id: string, config: CircuitBreakerConfig): void {
    const breaker: CircuitBreaker = {
      id,
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      config
    };

    this.circuitBreakers.set(id, breaker);
    this.logger.info(`Circuit breaker created: ${id}`);
  }

  private startMonitoring(): void {
    this.monitoringTimer = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metricsHistory.push(metrics);
        
        // Clean up old metrics
        this.cleanupMetricsHistory();
        
        // Check alert rules
        this.checkAlertRules(metrics);
        
        // Update circuit breakers
        this.updateCircuitBreakers(metrics);
        
        // Emit metrics event
        this.emit('metrics', metrics);
        
        // Attempt auto-recovery if enabled
        if (this.config.enableAutoRecovery) {
          await this.attemptAutoRecovery(metrics);
        }
        
      } catch (error) {
        this.logger.error('Health monitoring failed:', error);
      }
    }, this.config.checkInterval);

    this.logger.info('Health monitoring started');
  }

  private async collectMetrics(): Promise<HealthMetrics> {
    const timestamp = Date.now();

    // Collect RPC health metrics
    const rpcHealth = await this.collectRpcHealthMetrics();
    
    // Collect wallet health metrics
    const walletHealth = this.collectWalletHealthMetrics();
    
    // Collect transaction health metrics
    const transactionHealth = this.collectTransactionHealthMetrics();
    
    // Collect session health metrics
    const sessionHealth = this.collectSessionHealthMetrics();
    
    // Calculate overall health score
    const overallHealthScore = this.calculateOverallHealthScore({
      rpcHealth,
      walletHealth,
      transactionHealth,
      sessionHealth
    });

    // Determine overall status
    const overallStatus = this.determineOverallStatus(overallHealthScore, {
      rpcHealth,
      walletHealth,
      transactionHealth,
      sessionHealth
    });

    return {
      timestamp,
      rpcHealth,
      walletHealth,
      transactionHealth,
      sessionHealth,
      overallHealthScore,
      overallStatus
    };
  }

  private async collectRpcHealthMetrics(): Promise<HealthMetrics['rpcHealth']> {
    const rpcHealth: HealthMetrics['rpcHealth'] = {};
    const connectionStatus = connectionManager.getConnectionStatus();

    for (const [chainId, status] of Object.entries(connectionStatus)) {
      const chainIdNum = parseInt(chainId);
      const chainName = this.getChainName(chainIdNum);

      // Measure response time
      const responseTime = await this.measureRpcResponseTime(chainIdNum);
      
      // Calculate success rate from circuit breaker data
      const breakerId = `rpc_${chainIdNum}`;
      const breaker = this.circuitBreakers.get(breakerId);
      const successRate = breaker ? this.calculateSuccessRate(breaker) : 1.0;

      rpcHealth[chainIdNum] = {
        chainId: chainIdNum,
        chainName,
        totalEndpoints: status.total,
        healthyEndpoints: status.healthy,
        averageResponseTime: responseTime,
        successRate,
        status: status.status as 'healthy' | 'degraded' | 'critical'
      };
    }

    return rpcHealth;
  }

  private collectWalletHealthMetrics(): HealthMetrics['walletHealth'] {
    const walletState = walletConnectionManager.getState();
    
    return {
      isConnected: walletState.isConnected,
      provider: walletState.provider?.name,
      chainId: walletState.chainId || undefined,
      lastConnectionTime: walletState.lastConnection || undefined,
      connectionErrors: walletState.connectionAttempts,
      reconnectionAttempts: walletState.connectionAttempts,
      status: walletState.isConnecting ? 'connecting' : 
              walletState.isConnected ? 'connected' : 
              walletState.error ? 'error' : 'disconnected'
    };
  }

  private collectTransactionHealthMetrics(): HealthMetrics['transactionHealth'] {
    const metrics = transactionManager.getMetrics();
    const pendingTxs = transactionManager.getPendingTransactions();
    
    const totalTransactions = metrics.totalTransactions || 1; // Avoid division by zero
    const failureRate = metrics.failedTransactions / totalTransactions;
    const successRate = metrics.successfulTransactions / totalTransactions;
    
    // Get recent transaction errors
    const recentErrors: string[] = [];
    const recentTxs = transactionManager.getTransactionHistory().slice(-10);
    for (const tx of recentTxs) {
      if (tx.status === 'failed' && tx.error) {
        recentErrors.push(tx.error);
      }
    }

    // Determine status
    let status: 'healthy' | 'congested' | 'failing';
    if (failureRate > 0.2) {
      status = 'failing';
    } else if (pendingTxs.length > 10 || metrics.averageConfirmationTime > 300000) { // 5 minutes
      status = 'congested';
    } else {
      status = 'healthy';
    }

    return {
      pendingCount: pendingTxs.length,
      successRate,
      averageConfirmationTime: metrics.averageConfirmationTime,
      failureRate,
      gasEfficiency: this.calculateGasEfficiency(metrics),
      recentErrors: recentErrors.slice(0, 5), // Keep only last 5 errors
      status
    };
  }

  private collectSessionHealthMetrics(): HealthMetrics['sessionHealth'] {
    const sessionStats = sessionManager.getSessionStats();
    const sessionEvents = sessionManager.getSessionEvents(20);
    
    // Count session errors in recent events
    const recentSessionErrors = sessionEvents.filter(event => 
      event.type === 'failed' && Date.now() - event.timestamp < 300000 // Last 5 minutes
    ).length;

    // Calculate reconnection rate
    const reconnectionEvents = sessionEvents.filter(event => event.type === 'reconnected');
    const reconnectionRate = reconnectionEvents.length / Math.max(sessionStats.totalSessions, 1);

    // Determine status
    let status: 'healthy' | 'degraded' | 'critical';
    if (sessionStats.totalSessions === 0) {
      status = 'critical';
    } else if (recentSessionErrors > sessionStats.totalSessions * 0.1) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      activeSessions: sessionStats.totalSessions,
      authenticatedSessions: sessionStats.authenticatedSessions,
      averageSessionDuration: sessionStats.averageSessionDuration,
      sessionErrors: recentSessionErrors,
      reconnectionRate,
      status
    };
  }

  private async measureRpcResponseTime(chainId: number): Promise<number> {
    try {
      const startTime = Date.now();
      const publicClient = await connectionManager.getPublicClient(chainId, { timeout: 5000 });
      await publicClient.getBlockNumber();
      return Date.now() - startTime;
    } catch (error) {
      return -1; // Indicates failure
    }
  }

  private calculateSuccessRate(breaker: CircuitBreaker): number {
    const totalAttempts = breaker.successCount + breaker.failureCount;
    return totalAttempts > 0 ? breaker.successCount / totalAttempts : 1.0;
  }

  private calculateGasEfficiency(metrics: any): number {
    // Simplified gas efficiency calculation
    // In a real implementation, this would be more sophisticated
    return Math.max(0, 100 - (Number(metrics.averageGasUsed) / 21000 - 1) * 20);
  }

  private calculateOverallHealthScore(components: {
    rpcHealth: HealthMetrics['rpcHealth'];
    walletHealth: HealthMetrics['walletHealth'];
    transactionHealth: HealthMetrics['transactionHealth'];
    sessionHealth: HealthMetrics['sessionHealth'];
  }): number {
    let totalScore = 0;
    let componentCount = 0;

    // RPC Health Score (40% weight)
    const rpcScores = Object.values(components.rpcHealth).map(rpc => {
      switch (rpc.status) {
        case 'healthy': return 100;
        case 'degraded': return 60;
        case 'critical': return 20;
        default: return 0;
      }
    });
    const avgRpcScore = rpcScores.length > 0 ? Math.round(rpcScores.reduce((a, b) => a + b) / rpcScores.length) : 100;
    totalScore += avgRpcScore * 0.4;
    componentCount += 0.4;

    // Wallet Health Score (20% weight)
    let walletScore = 0;
    switch (components.walletHealth.status) {
      case 'connected': walletScore = 100; break;
      case 'connecting': walletScore = 80; break;
      case 'disconnected': walletScore = 50; break;
      case 'error': walletScore = 20; break;
    }
    totalScore += walletScore * 0.2;
    componentCount += 0.2;

    // Transaction Health Score (25% weight)
    let transactionScore = 0;
    switch (components.transactionHealth.status) {
      case 'healthy': transactionScore = 100; break;
      case 'congested': transactionScore = 70; break;
      case 'failing': transactionScore = 30; break;
    }
    totalScore += transactionScore * 0.25;
    componentCount += 0.25;

    // Session Health Score (15% weight)
    let sessionScore = 0;
    switch (components.sessionHealth.status) {
      case 'healthy': sessionScore = 100; break;
      case 'degraded': sessionScore = 60; break;
      case 'critical': sessionScore = 20; break;
    }
    totalScore += sessionScore * 0.15;
    componentCount += 0.15;

    return Math.round(totalScore / componentCount);
  }

  private determineOverallStatus(
    healthScore: number, 
    components: any
  ): 'healthy' | 'degraded' | 'critical' | 'offline' {
    // Check for offline conditions
    const allRpcsCritical = Object.values(components.rpcHealth).every((rpc: any) => rpc.status === 'critical');
    if (allRpcsCritical) {
      return 'offline';
    }

    // Determine status based on score and critical components
    if (healthScore >= 85) {
      return 'healthy';
    } else if (healthScore >= 60) {
      return 'degraded';
    } else {
      return 'critical';
    }
  }

  private checkAlertRules(metrics: HealthMetrics): void {
    const now = Date.now();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (now - rule.lastTriggered < rule.cooldown) continue;

      // Check condition
      try {
        if (rule.condition(metrics)) {
          this.triggerAlert(rule, metrics);
          rule.lastTriggered = now;
        }
      } catch (error) {
        this.logger.error(`Error checking alert rule ${rule.id}:`, error);
      }
    }
  }

  private triggerAlert(rule: AlertRule, metrics: HealthMetrics): void {
    const alert: HealthAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      timestamp: Date.now(),
      metrics,
      resolved: false
    };

    this.alerts.push(alert);
    this.logger.warn(`Health alert triggered: ${rule.name}`, {
      severity: rule.severity,
      description: rule.description
    });

    this.emit('alert', alert);
  }

  private updateCircuitBreakers(metrics: HealthMetrics): void {
    if (!this.config.enableCircuitBreakers) return;

    const now = Date.now();

    for (const [id, breaker] of this.circuitBreakers) {
      // Update RPC circuit breakers
      if (id.startsWith('rpc_')) {
        const chainId = parseInt(id.replace('rpc_', ''));
        const rpcHealth = metrics.rpcHealth[chainId];
        
        if (rpcHealth) {
          if (rpcHealth.status === 'critical' || rpcHealth.averageResponseTime === -1) {
            this.recordCircuitBreakerFailure(breaker);
          } else if (rpcHealth.status === 'healthy') {
            this.recordCircuitBreakerSuccess(breaker);
          }
        }
      }

      // Update wallet circuit breaker
      if (id === 'wallet_connection') {
        if (metrics.walletHealth.status === 'error') {
          this.recordCircuitBreakerFailure(breaker);
        } else if (metrics.walletHealth.status === 'connected') {
          this.recordCircuitBreakerSuccess(breaker);
        }
      }

      // Update transaction circuit breaker
      if (id === 'transactions') {
        if (metrics.transactionHealth.status === 'failing') {
          this.recordCircuitBreakerFailure(breaker);
        } else if (metrics.transactionHealth.status === 'healthy') {
          this.recordCircuitBreakerSuccess(breaker);
        }
      }

      // Update circuit breaker state
      this.updateCircuitBreakerState(breaker, now);
    }
  }

  private recordCircuitBreakerFailure(breaker: CircuitBreaker): void {
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();
    
    if (breaker.state === 'half-open') {
      breaker.state = 'open';
      breaker.nextAttemptTime = Date.now() + breaker.config.timeout;
    }
  }

  private recordCircuitBreakerSuccess(breaker: CircuitBreaker): void {
    if (breaker.state === 'half-open') {
      breaker.successCount++;
      if (breaker.successCount >= breaker.config.successThreshold) {
        breaker.state = 'closed';
        breaker.failureCount = 0;
        breaker.successCount = 0;
      }
    } else if (breaker.state === 'closed') {
      // Reset failure count on success
      breaker.failureCount = Math.max(0, breaker.failureCount - 1);
    }
  }

  private updateCircuitBreakerState(breaker: CircuitBreaker, now: number): void {
    switch (breaker.state) {
      case 'closed':
        if (breaker.failureCount >= breaker.config.failureThreshold) {
          breaker.state = 'open';
          breaker.nextAttemptTime = now + breaker.config.timeout;
          this.emit('circuit-breaker-opened', breaker);
        }
        break;
        
      case 'open':
        if (now >= breaker.nextAttemptTime) {
          breaker.state = 'half-open';
          breaker.successCount = 0;
          this.emit('circuit-breaker-half-opened', breaker);
        }
        break;
    }
  }

  private async attemptAutoRecovery(metrics: HealthMetrics): Promise<void> {
    // Auto-recovery for wallet connections
    if (metrics.walletHealth.status === 'error' && metrics.walletHealth.connectionErrors < 5) {
      try {
        // Attempt to reconnect with last known provider
        const currentSession = sessionManager.getCurrentSession();
        if (currentSession) {
          await sessionManager.attemptReconnection(currentSession);
        }
      } catch (error) {
        this.logger.warn('Auto-recovery for wallet failed:', error);
      }
    }

    // Auto-recovery for RPC connections
    for (const [chainId, rpcHealth] of Object.entries(metrics.rpcHealth)) {
      if (rpcHealth.status === 'critical') {
        // Circuit breaker will handle RPC failover automatically
        this.logger.info(`RPC auto-recovery triggered for chain ${chainId}`);
      }
    }
  }

  private cleanupMetricsHistory(): void {
    const cutoff = Date.now() - this.config.metricsRetentionPeriod;
    this.metricsHistory = this.metricsHistory.filter(metrics => metrics.timestamp > cutoff);

    // Clean up old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  private getChainName(chainId: number): string {
    const chainNames: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      8453: 'Base',
      10: 'Optimism',
      56: 'BNB Chain'
    };
    return chainNames[chainId] || `Chain ${chainId}`;
  }

  // Public API
  public getCurrentMetrics(): HealthMetrics | null {
    return this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1] : null;
  }

  public getMetricsHistory(limit = 100): HealthMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  public getActiveAlerts(): HealthAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public getAllAlerts(limit = 50): HealthAlert[] {
    return this.alerts.slice(-limit);
  }

  public getCircuitBreakers(): CircuitBreaker[] {
    return Array.from(this.circuitBreakers.values());
  }

  public getCircuitBreaker(id: string): CircuitBreaker | null {
    return this.circuitBreakers.get(id) || null;
  }

  public isCircuitBreakerOpen(id: string): boolean {
    const breaker = this.circuitBreakers.get(id);
    return breaker ? breaker.state === 'open' : false;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.emit('alert-resolved', alert);
      return true;
    }
    return false;
  }

  public addAlertRule(rule: Omit<AlertRule, 'lastTriggered'>): void {
    this.alertRules.push({
      ...rule,
      lastTriggered: 0
    });
  }

  public removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (index >= 0) {
      this.alertRules.splice(index, 1);
      return true;
    }
    return false;
  }

  // Event management
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.warn('Error in event callback:', error);
        }
      });
    }
  }

  public cleanup(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    this.listeners.clear();
    this.metricsHistory.length = 0;
    this.alerts.length = 0;
    this.circuitBreakers.clear();

    this.logger.info('Health monitor cleanup completed');
  }
}

// Export singleton instance
export const healthMonitor = new CrashSafeHealthMonitor();