#!/usr/bin/env node

/**
 * Performance Monitor and Bottleneck Detection Script
 * 
 * This script monitors system performance during load tests and identifies bottlenecks
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      interval: options.interval || 5000, // 5 seconds
      duration: options.duration || 3600000, // 1 hour
      outputDir: options.outputDir || './performance-results',
      thresholds: {
        cpuUsage: options.cpuThreshold || 80,
        memoryUsage: options.memoryThreshold || 85,
        diskUsage: options.diskThreshold || 90,
        responseTime: options.responseTimeThreshold || 2000,
        errorRate: options.errorRateThreshold || 5
      },
      ...options
    };
    
    this.metrics = {
      system: [],
      database: [],
      redis: [],
      application: [],
      network: [],
      bottlenecks: []
    };
    
    this.isMonitoring = false;
    this.startTime = null;
    this.intervals = [];
  }

  /**
   * Start performance monitoring
   */
  async start() {
    if (this.isMonitoring) {
      console.log('⚠️ Performance monitoring already running');
      return;
    }

    console.log('🚀 Starting performance monitoring...');
    this.isMonitoring = true;
    this.startTime = Date.now();

    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Start monitoring intervals
    this.startSystemMonitoring();
    this.startDatabaseMonitoring();
    this.startRedisMonitoring();
    this.startApplicationMonitoring();
    this.startNetworkMonitoring();
    this.startBottleneckDetection();

    // Auto-stop after duration
    if (this.options.duration > 0) {
      setTimeout(() => {
        this.stop();
      }, this.options.duration);
    }

    console.log(`📊 Performance monitoring started (interval: ${this.options.interval}ms)`);
  }

  /**
   * Stop performance monitoring
   */
  async stop() {
    if (!this.isMonitoring) {
      console.log('⚠️ Performance monitoring not running');
      return;
    }

    console.log('🛑 Stopping performance monitoring...');
    this.isMonitoring = false;

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    // Generate final report
    await this.generateReport();

    console.log('✅ Performance monitoring stopped');
  }

  /**
   * Start system resource monitoring
   */
  startSystemMonitoring() {
    const interval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        const systemMetrics = await this.collectSystemMetrics();
        this.metrics.system.push({
          timestamp: Date.now(),
          ...systemMetrics
        });

        // Check system bottlenecks
        this.checkSystemBottlenecks(systemMetrics);

      } catch (error) {
        console.error('System monitoring error:', error);
      }
    }, this.options.interval);

    this.intervals.push(interval);
  }

  /**
   * Start database monitoring
   */
  startDatabaseMonitoring() {
    const interval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        const dbMetrics = await this.collectDatabaseMetrics();
        this.metrics.database.push({
          timestamp: Date.now(),
          ...dbMetrics
        });

        // Check database bottlenecks
        this.checkDatabaseBottlenecks(dbMetrics);

      } catch (error) {
        console.error('Database monitoring error:', error);
      }
    }, this.options.interval);

    this.intervals.push(interval);
  }

  /**
   * Start Redis monitoring
   */
  startRedisMonitoring() {
    const interval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        const redisMetrics = await this.collectRedisMetrics();
        this.metrics.redis.push({
          timestamp: Date.now(),
          ...redisMetrics
        });

        // Check Redis bottlenecks
        this.checkRedisBottlenecks(redisMetrics);

      } catch (error) {
        console.error('Redis monitoring error:', error);
      }
    }, this.options.interval);

    this.intervals.push(interval);
  }

  /**
   * Start application monitoring
   */
  startApplicationMonitoring() {
    const interval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        const appMetrics = await this.collectApplicationMetrics();
        this.metrics.application.push({
          timestamp: Date.now(),
          ...appMetrics
        });

        // Check application bottlenecks
        this.checkApplicationBottlenecks(appMetrics);

      } catch (error) {
        console.error('Application monitoring error:', error);
      }
    }, this.options.interval);

    this.intervals.push(interval);
  }

  /**
   * Start network monitoring
   */
  startNetworkMonitoring() {
    const interval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        const networkMetrics = await this.collectNetworkMetrics();
        this.metrics.network.push({
          timestamp: Date.now(),
          ...networkMetrics
        });

        // Check network bottlenecks
        this.checkNetworkBottlenecks(networkMetrics);

      } catch (error) {
        console.error('Network monitoring error:', error);
      }
    }, this.options.interval);

    this.intervals.push(interval);
  }

  /**
   * Start bottleneck detection
   */
  startBottleneckDetection() {
    const interval = setInterval(() => {
      if (!this.isMonitoring) return;

      this.detectSystemBottlenecks();
      this.detectPerformanceDegradation();
      this.detectResourceLeaks();

    }, this.options.interval * 2); // Run less frequently

    this.intervals.push(interval);
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const diskUsage = await this.getDiskUsage();
    const loadAverage = os.loadavg();

    return {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        model: os.cpus()[0].model
      },
      memory: {
        total: memoryUsage.total,
        free: memoryUsage.free,
        used: memoryUsage.used,
        usagePercent: memoryUsage.usagePercent
      },
      disk: diskUsage,
      load: {
        '1m': loadAverage[0],
        '5m': loadAverage[1],
        '15m': loadAverage[2]
      },
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch()
    };
  }

  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics() {
    try {
      // PostgreSQL metrics
      const pgMetrics = await this.getPostgreSQLMetrics();
      return pgMetrics;
    } catch (error) {
      console.error('Failed to collect database metrics:', error);
      return { error: error.message };
    }
  }

  /**
   * Collect Redis metrics
   */
  async collectRedisMetrics() {
    try {
      const redisMetrics = await this.getRedisMetrics();
      return redisMetrics;
    } catch (error) {
      console.error('Failed to collect Redis metrics:', error);
      return { error: error.message };
    }
  }

  /**
   * Collect application metrics
   */
  async collectApplicationMetrics() {
    try {
      // Node.js process metrics
      const processMetrics = this.getProcessMetrics();
      
      // API response time metrics
      const apiMetrics = await this.getAPIMetrics();

      return {
        process: processMetrics,
        api: apiMetrics,
        eventLoop: this.getEventLoopMetrics()
      };
    } catch (error) {
      console.error('Failed to collect application metrics:', error);
      return { error: error.message };
    }
  }

  /**
   * Collect network metrics
   */
  async collectNetworkMetrics() {
    try {
      const networkStats = await this.getNetworkStats();
      const connectionStats = await this.getConnectionStats();

      return {
        interfaces: networkStats,
        connections: connectionStats,
        bandwidth: await this.getBandwidthUsage()
      };
    } catch (error) {
      console.error('Failed to collect network metrics:', error);
      return { error: error.message };
    }
  }

  /**
   * Get CPU usage
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime.bigint();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime.bigint();
        
        const elapsedTime = Number(endTime - startTime) / 1000000; // Convert to ms
        const totalUsage = (endUsage.user + endUsage.system) / 1000; // Convert to ms
        
        const usage = Math.min(100, (totalUsage / elapsedTime) * 100);
        resolve(Math.round(usage * 100) / 100);
      }, 100);
    });
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usagePercent = (used / total) * 100;

    return {
      total: Math.round(total / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024),   // MB
      used: Math.round(used / 1024 / 1024),   // MB
      usagePercent: Math.round(usagePercent * 100) / 100
    };
  }

  /**
   * Get disk usage
   */
  async getDiskUsage() {
    try {
      const { stdout } = await execAsync('df -h / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      
      return {
        filesystem: parts[0],
        total: parts[1],
        used: parts[2],
        available: parts[3],
        usagePercent: parseInt(parts[4].replace('%', ''))
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get PostgreSQL metrics
   */
  async getPostgreSQLMetrics() {
    try {
      // Simulate PostgreSQL metrics (would use actual DB connection in production)
      const mockMetrics = {
        connections: {
          active: Math.floor(Math.random() * 50) + 10,
          idle: Math.floor(Math.random() * 20) + 5,
          max: 100
        },
        queries: {
          select: Math.floor(Math.random() * 1000) + 100,
          insert: Math.floor(Math.random() * 200) + 50,
          update: Math.floor(Math.random() * 150) + 25,
          delete: Math.floor(Math.random() * 50) + 10
        },
        performance: {
          avgQueryTime: Math.random() * 100 + 10, // ms
          slowQueries: Math.floor(Math.random() * 5),
          cacheHitRatio: 85 + Math.random() * 10 // 85-95%
        },
        locks: {
          acquired: Math.floor(Math.random() * 100) + 10,
          waiting: Math.floor(Math.random() * 5)
        }
      };

      return mockMetrics;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get Redis metrics
   */
  async getRedisMetrics() {
    try {
      // Simulate Redis metrics (would use actual Redis connection in production)
      const mockMetrics = {
        connections: Math.floor(Math.random() * 30) + 5,
        usedMemory: Math.floor(Math.random() * 100) + 50, // MB
        hitRatio: 90 + Math.random() * 8, // 90-98%
        operations: {
          get: Math.floor(Math.random() * 2000) + 500,
          set: Math.floor(Math.random() * 500) + 100,
          del: Math.floor(Math.random() * 100) + 20
        },
        keyspace: {
          keys: Math.floor(Math.random() * 10000) + 1000,
          expires: Math.floor(Math.random() * 1000) + 100
        }
      };

      return mockMetrics;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get process metrics
   */
  getProcessMetrics() {
    const memUsage = process.memoryUsage();
    
    return {
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      cpu: process.cpuUsage(),
      version: process.version,
      nodeVersion: process.versions.node
    };
  }

  /**
   * Get API metrics
   */
  async getAPIMetrics() {
    try {
      // Test API endpoints
      const healthCheck = await this.testAPIEndpoint('http://localhost:3002/api/v1/health');
      
      return {
        health: healthCheck,
        endpoints: {
          '/health': healthCheck.responseTime
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Test API endpoint
   */
  async testAPIEndpoint(url) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      
      return {
        status: response.status,
        responseTime: responseTime,
        success: response.ok
      };
    } catch (error) {
      return {
        status: 0,
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get event loop metrics
   */
  getEventLoopMetrics() {
    // Simple event loop delay measurement
    const start = process.hrtime.bigint();
    
    return new Promise((resolve) => {
      setImmediate(() => {
        const delay = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
        resolve({
          delay: Math.round(delay * 100) / 100
        });
      });
    });
  }

  /**
   * Get network stats
   */
  async getNetworkStats() {
    try {
      const interfaces = os.networkInterfaces();
      const stats = {};
      
      for (const [name, addresses] of Object.entries(interfaces)) {
        stats[name] = addresses.map(addr => ({
          address: addr.address,
          netmask: addr.netmask,
          family: addr.family,
          internal: addr.internal
        }));
      }
      
      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get connection stats
   */
  async getConnectionStats() {
    try {
      const { stdout } = await execAsync('netstat -an | grep :3002 | wc -l');
      const connections = parseInt(stdout.trim());
      
      return {
        port3002: connections,
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get bandwidth usage
   */
  async getBandwidthUsage() {
    try {
      // Simulate bandwidth metrics (would use actual network monitoring in production)
      return {
        incoming: Math.floor(Math.random() * 100) + 10, // Mbps
        outgoing: Math.floor(Math.random() * 80) + 15,  // Mbps
        total: Math.floor(Math.random() * 180) + 25     // Mbps
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Check system bottlenecks
   */
  checkSystemBottlenecks(metrics) {
    const bottlenecks = [];
    
    if (metrics.cpu.usage > this.options.thresholds.cpuUsage) {
      bottlenecks.push({
        type: 'cpu',
        severity: 'high',
        message: `CPU usage at ${metrics.cpu.usage}% (threshold: ${this.options.thresholds.cpuUsage}%)`,
        value: metrics.cpu.usage,
        timestamp: Date.now()
      });
    }
    
    if (metrics.memory.usagePercent > this.options.thresholds.memoryUsage) {
      bottlenecks.push({
        type: 'memory',
        severity: 'high',
        message: `Memory usage at ${metrics.memory.usagePercent}% (threshold: ${this.options.thresholds.memoryUsage}%)`,
        value: metrics.memory.usagePercent,
        timestamp: Date.now()
      });
    }
    
    if (metrics.disk && metrics.disk.usagePercent > this.options.thresholds.diskUsage) {
      bottlenecks.push({
        type: 'disk',
        severity: 'high',
        message: `Disk usage at ${metrics.disk.usagePercent}% (threshold: ${this.options.thresholds.diskUsage}%)`,
        value: metrics.disk.usagePercent,
        timestamp: Date.now()
      });
    }
    
    if (bottlenecks.length > 0) {
      this.metrics.bottlenecks.push(...bottlenecks);
      bottlenecks.forEach(b => console.warn(`🔴 BOTTLENECK DETECTED: ${b.message}`));
    }
  }

  /**
   * Check database bottlenecks
   */
  checkDatabaseBottlenecks(metrics) {
    if (metrics.error) return;
    
    const bottlenecks = [];
    
    if (metrics.performance && metrics.performance.avgQueryTime > 1000) {
      bottlenecks.push({
        type: 'database_query_time',
        severity: 'medium',
        message: `Average query time: ${metrics.performance.avgQueryTime}ms`,
        value: metrics.performance.avgQueryTime,
        timestamp: Date.now()
      });
    }
    
    if (metrics.connections && metrics.connections.active / metrics.connections.max > 0.8) {
      bottlenecks.push({
        type: 'database_connections',
        severity: 'high',
        message: `Database connection usage at ${Math.round((metrics.connections.active / metrics.connections.max) * 100)}%`,
        value: metrics.connections.active,
        timestamp: Date.now()
      });
    }
    
    if (bottlenecks.length > 0) {
      this.metrics.bottlenecks.push(...bottlenecks);
      bottlenecks.forEach(b => console.warn(`🔴 DB BOTTLENECK: ${b.message}`));
    }
  }

  /**
   * Check Redis bottlenecks
   */
  checkRedisBottlenecks(metrics) {
    if (metrics.error) return;
    
    const bottlenecks = [];
    
    if (metrics.hitRatio < 80) {
      bottlenecks.push({
        type: 'redis_hit_ratio',
        severity: 'medium',
        message: `Redis hit ratio low: ${metrics.hitRatio}%`,
        value: metrics.hitRatio,
        timestamp: Date.now()
      });
    }
    
    if (metrics.usedMemory > 200) { // 200MB threshold
      bottlenecks.push({
        type: 'redis_memory',
        severity: 'medium',
        message: `Redis memory usage: ${metrics.usedMemory}MB`,
        value: metrics.usedMemory,
        timestamp: Date.now()
      });
    }
    
    if (bottlenecks.length > 0) {
      this.metrics.bottlenecks.push(...bottlenecks);
      bottlenecks.forEach(b => console.warn(`🔴 REDIS BOTTLENECK: ${b.message}`));
    }
  }

  /**
   * Check application bottlenecks
   */
  checkApplicationBottlenecks(metrics) {
    if (metrics.error) return;
    
    const bottlenecks = [];
    
    if (metrics.api && metrics.api.health && metrics.api.health.responseTime > this.options.thresholds.responseTime) {
      bottlenecks.push({
        type: 'api_response_time',
        severity: 'high',
        message: `API response time: ${metrics.api.health.responseTime}ms`,
        value: metrics.api.health.responseTime,
        timestamp: Date.now()
      });
    }
    
    if (metrics.process && metrics.process.memory.heapUsed > 512) { // 512MB threshold
      bottlenecks.push({
        type: 'application_memory',
        severity: 'medium',
        message: `Application heap usage: ${metrics.process.memory.heapUsed}MB`,
        value: metrics.process.memory.heapUsed,
        timestamp: Date.now()
      });
    }
    
    if (bottlenecks.length > 0) {
      this.metrics.bottlenecks.push(...bottlenecks);
      bottlenecks.forEach(b => console.warn(`🔴 APP BOTTLENECK: ${b.message}`));
    }
  }

  /**
   * Check network bottlenecks
   */
  checkNetworkBottlenecks(metrics) {
    if (metrics.error) return;
    
    const bottlenecks = [];
    
    if (metrics.bandwidth && metrics.bandwidth.total > 150) { // 150 Mbps threshold
      bottlenecks.push({
        type: 'network_bandwidth',
        severity: 'medium',
        message: `High network usage: ${metrics.bandwidth.total} Mbps`,
        value: metrics.bandwidth.total,
        timestamp: Date.now()
      });
    }
    
    if (bottlenecks.length > 0) {
      this.metrics.bottlenecks.push(...bottlenecks);
      bottlenecks.forEach(b => console.warn(`🔴 NETWORK BOTTLENECK: ${b.message}`));
    }
  }

  /**
   * Detect system bottlenecks
   */
  detectSystemBottlenecks() {
    // Analysis of recent metrics to detect patterns
    const recentMetrics = this.metrics.system.slice(-5); // Last 5 measurements
    
    if (recentMetrics.length < 3) return;
    
    // Check for sustained high resource usage
    const avgCPU = recentMetrics.reduce((sum, m) => sum + (m.cpu?.usage || 0), 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + (m.memory?.usagePercent || 0), 0) / recentMetrics.length;
    
    if (avgCPU > this.options.thresholds.cpuUsage * 0.9) {
      this.logBottleneck('sustained_cpu_high', `Sustained high CPU usage: ${avgCPU.toFixed(1)}%`);
    }
    
    if (avgMemory > this.options.thresholds.memoryUsage * 0.9) {
      this.logBottleneck('sustained_memory_high', `Sustained high memory usage: ${avgMemory.toFixed(1)}%`);
    }
  }

  /**
   * Detect performance degradation
   */
  detectPerformanceDegradation() {
    const recentAppMetrics = this.metrics.application.slice(-5);
    
    if (recentAppMetrics.length < 3) return;
    
    const responseTimes = recentAppMetrics
      .filter(m => m.api && m.api.health && m.api.health.responseTime)
      .map(m => m.api.health.responseTime);
    
    if (responseTimes.length >= 3) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const trend = this.calculateTrend(responseTimes);
      
      if (avgResponseTime > this.options.thresholds.responseTime && trend > 10) {
        this.logBottleneck('performance_degradation', `Increasing response times: ${avgResponseTime.toFixed(1)}ms (trend: +${trend.toFixed(1)}ms)`);
      }
    }
  }

  /**
   * Detect resource leaks
   */
  detectResourceLeaks() {
    const recentAppMetrics = this.metrics.application.slice(-10);
    
    if (recentAppMetrics.length < 5) return;
    
    const memoryUsages = recentAppMetrics
      .filter(m => m.process && m.process.memory)
      .map(m => m.process.memory.heapUsed);
    
    if (memoryUsages.length >= 5) {
      const trend = this.calculateTrend(memoryUsages);
      const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
      
      if (trend > 5 && avgMemory > 200) { // Growing by >5MB per interval and >200MB total
        this.logBottleneck('memory_leak', `Potential memory leak detected: ${avgMemory.toFixed(1)}MB (trend: +${trend.toFixed(1)}MB)`);
      }
    }
  }

  /**
   * Calculate trend in data
   */
  calculateTrend(data) {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Log bottleneck
   */
  logBottleneck(type, message) {
    const bottleneck = {
      type: type,
      severity: 'medium',
      message: message,
      timestamp: Date.now()
    };
    
    this.metrics.bottlenecks.push(bottleneck);
    console.warn(`🔍 PATTERN DETECTED: ${message}`);
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport() {
    const reportData = {
      summary: this.generateSummary(),
      metrics: this.metrics,
      analysis: this.generateAnalysis(),
      recommendations: this.generateRecommendations(),
      metadata: {
        startTime: this.startTime,
        endTime: Date.now(),
        duration: Date.now() - this.startTime,
        interval: this.options.interval,
        thresholds: this.options.thresholds
      }
    };

    // Write detailed JSON report
    const jsonReport = path.join(this.options.outputDir, `performance-report-${Date.now()}.json`);
    fs.writeFileSync(jsonReport, JSON.stringify(reportData, null, 2));

    // Write summary text report
    const textReport = path.join(this.options.outputDir, `performance-summary-${Date.now()}.txt`);
    fs.writeFileSync(textReport, this.generateTextReport(reportData));

    console.log(`📊 Performance report generated:`);
    console.log(`   JSON: ${jsonReport}`);
    console.log(`   Text: ${textReport}`);

    return reportData;
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    const duration = Date.now() - this.startTime;
    const bottleneckCount = this.metrics.bottlenecks.length;
    const criticalBottlenecks = this.metrics.bottlenecks.filter(b => b.severity === 'high').length;
    
    // Calculate averages
    const avgCPU = this.calculateAverage(this.metrics.system.map(m => m.cpu?.usage).filter(Boolean));
    const avgMemory = this.calculateAverage(this.metrics.system.map(m => m.memory?.usagePercent).filter(Boolean));
    const avgResponseTime = this.calculateAverage(
      this.metrics.application.map(m => m.api?.health?.responseTime).filter(Boolean)
    );

    return {
      duration: Math.round(duration / 1000), // seconds
      dataPoints: this.metrics.system.length,
      bottlenecks: {
        total: bottleneckCount,
        critical: criticalBottlenecks,
        types: [...new Set(this.metrics.bottlenecks.map(b => b.type))]
      },
      averages: {
        cpu: avgCPU ? Math.round(avgCPU * 100) / 100 : null,
        memory: avgMemory ? Math.round(avgMemory * 100) / 100 : null,
        responseTime: avgResponseTime ? Math.round(avgResponseTime) : null
      }
    };
  }

  /**
   * Generate analysis
   */
  generateAnalysis() {
    const analysis = {
      performance: 'good',
      bottlenecks: [],
      trends: {},
      capacity: {}
    };

    // Performance assessment
    const criticalBottlenecks = this.metrics.bottlenecks.filter(b => b.severity === 'high').length;
    if (criticalBottlenecks > 5) {
      analysis.performance = 'poor';
    } else if (criticalBottlenecks > 2) {
      analysis.performance = 'degraded';
    }

    // Bottleneck analysis
    const bottleneckTypes = {};
    this.metrics.bottlenecks.forEach(b => {
      bottleneckTypes[b.type] = (bottleneckTypes[b.type] || 0) + 1;
    });

    analysis.bottlenecks = Object.entries(bottleneckTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Trend analysis
    if (this.metrics.system.length > 5) {
      const cpuTrend = this.calculateTrend(this.metrics.system.map(m => m.cpu?.usage || 0));
      const memoryTrend = this.calculateTrend(this.metrics.system.map(m => m.memory?.usagePercent || 0));
      
      analysis.trends = {
        cpu: cpuTrend > 2 ? 'increasing' : cpuTrend < -2 ? 'decreasing' : 'stable',
        memory: memoryTrend > 2 ? 'increasing' : memoryTrend < -2 ? 'decreasing' : 'stable'
      };
    }

    return analysis;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const bottleneckTypes = new Set(this.metrics.bottlenecks.map(b => b.type));

    if (bottleneckTypes.has('cpu')) {
      recommendations.push({
        category: 'CPU',
        priority: 'high',
        recommendation: 'Consider scaling horizontally or optimizing CPU-intensive operations'
      });
    }

    if (bottleneckTypes.has('memory')) {
      recommendations.push({
        category: 'Memory',
        priority: 'high',
        recommendation: 'Increase server memory or optimize memory usage patterns'
      });
    }

    if (bottleneckTypes.has('database_query_time')) {
      recommendations.push({
        category: 'Database',
        priority: 'medium',
        recommendation: 'Optimize slow queries, add indexes, or consider database scaling'
      });
    }

    if (bottleneckTypes.has('api_response_time')) {
      recommendations.push({
        category: 'API',
        priority: 'high',
        recommendation: 'Optimize API endpoints, implement caching, or add load balancing'
      });
    }

    if (bottleneckTypes.has('memory_leak')) {
      recommendations.push({
        category: 'Application',
        priority: 'critical',
        recommendation: 'Investigate and fix memory leaks in application code'
      });
    }

    return recommendations;
  }

  /**
   * Generate text report
   */
  generateTextReport(data) {
    const lines = [];
    
    lines.push('PERFORMANCE MONITORING REPORT');
    lines.push('=' .repeat(50));
    lines.push('');
    
    lines.push('SUMMARY:');
    lines.push(`Duration: ${data.summary.duration} seconds`);
    lines.push(`Data Points: ${data.summary.dataPoints}`);
    lines.push(`Total Bottlenecks: ${data.summary.bottlenecks.total}`);
    lines.push(`Critical Bottlenecks: ${data.summary.bottlenecks.critical}`);
    lines.push('');
    
    if (data.summary.averages.cpu) {
      lines.push('AVERAGE METRICS:');
      lines.push(`CPU Usage: ${data.summary.averages.cpu}%`);
      lines.push(`Memory Usage: ${data.summary.averages.memory}%`);
      lines.push(`API Response Time: ${data.summary.averages.responseTime}ms`);
      lines.push('');
    }
    
    if (data.analysis.bottlenecks.length > 0) {
      lines.push('TOP BOTTLENECKS:');
      data.analysis.bottlenecks.slice(0, 5).forEach(b => {
        lines.push(`- ${b.type}: ${b.count} occurrences`);
      });
      lines.push('');
    }
    
    if (data.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS:');
      data.recommendations.forEach(r => {
        lines.push(`[${r.priority.toUpperCase()}] ${r.category}: ${r.recommendation}`);
      });
      lines.push('');
    }
    
    lines.push(`Report generated: ${new Date().toISOString()}`);
    
    return lines.join('\n');
  }

  /**
   * Calculate average
   */
  calculateAverage(values) {
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

module.exports = PerformanceMonitor;

// CLI usage
if (require.main === module) {
  const monitor = new PerformanceMonitor({
    interval: 5000,
    duration: 600000, // 10 minutes
    outputDir: './performance-results'
  });

  console.log('Starting performance monitoring...');
  monitor.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT, stopping monitor...');
    monitor.stop();
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, stopping monitor...');
    monitor.stop();
  });
}