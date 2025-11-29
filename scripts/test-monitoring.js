const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

class TestMonitoringSystem {
  constructor() {
    this.config = {
      monitoring_interval: 5 * 60 * 1000, // 5 minutes
      alert_cooldown: 30 * 60 * 1000, // 30 minutes
      api_url: process.env.API_URL || 'http://localhost:4000',
      web_url: process.env.WEB_URL || 'http://localhost:3000',
      mobile_url: process.env.MOBILE_URL || 'http://localhost:8081',
      slack_webhook: process.env.SLACK_WEBHOOK_URL,
      email_config: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        recipients: (process.env.EMAIL_RECIPIENTS || '').split(',').filter(Boolean)
      },
      thresholds: {
        response_time_ms: 2000,
        error_rate_percent: 5,
        success_rate_percent: 95,
        cpu_percent: 80,
        memory_percent: 85,
        disk_percent: 90
      }
    };

    this.metrics = {
      api_health: null,
      web_health: null,
      mobile_health: null,
      test_results: {},
      system_resources: {},
      alerts: [],
      last_check: null
    };

    this.alertHistory = new Map();
    this.isRunning = false;
  }

  async start() {
    console.log('🔍 Starting CRYB Test Monitoring System');
    console.log('Configuration:', JSON.stringify(this.config, null, 2));
    console.log('=' .repeat(60));

    this.isRunning = true;
    
    // Initial check
    await this.performHealthCheck();
    
    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.performHealthCheck();
      }
    }, this.config.monitoring_interval);

    console.log(`✅ Monitoring started with ${this.config.monitoring_interval / 1000}s interval`);
  }

  async stop() {
    console.log('⏹️  Stopping Test Monitoring System');
    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    await this.generateMonitoringReport();
    console.log('✅ Monitoring stopped');
  }

  async performHealthCheck() {
    console.log(`🏥 Performing health check at ${new Date().toISOString()}`);
    
    try {
      // Check service health
      await this.checkAPIHealth();
      await this.checkWebHealth();
      await this.checkMobileHealth();
      
      // Check system resources
      await this.checkSystemResources();
      
      // Check test results
      await this.checkTestResults();
      
      // Evaluate alerts
      await this.evaluateAlerts();
      
      // Update metrics
      this.metrics.last_check = new Date().toISOString();
      
      // Save metrics
      await this.saveMetrics();
      
      console.log('✅ Health check completed');
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      await this.sendAlert('HEALTH_CHECK_FAILED', 'Health check process failed', error.message);
    }
  }

  async checkAPIHealth() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.config.api_url}/health`, { timeout: 10000 });
      const responseTime = Date.now() - startTime;
      
      this.metrics.api_health = {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        response_time: responseTime,
        timestamp: new Date().toISOString(),
        data: response.data
      };
      
      if (responseTime > this.config.thresholds.response_time_ms) {
        await this.sendAlert('API_SLOW_RESPONSE', 'API response time exceeded threshold', 
          `API responded in ${responseTime}ms (threshold: ${this.config.thresholds.response_time_ms}ms)`);
      }
      
      console.log(`✅ API Health: ${this.metrics.api_health.status} (${responseTime}ms)`);
      
    } catch (error) {
      this.metrics.api_health = {
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      await this.sendAlert('API_DOWN', 'API service is down', error.message);
      console.log(`❌ API Health: down (${error.message})`);
    }
  }

  async checkWebHealth() {
    try {
      const startTime = Date.now();
      const response = await axios.get(this.config.web_url, { 
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept redirects
      });
      const responseTime = Date.now() - startTime;
      
      this.metrics.web_health = {
        status: response.status < 400 ? 'healthy' : 'unhealthy',
        response_time: responseTime,
        timestamp: new Date().toISOString(),
        status_code: response.status
      };
      
      if (responseTime > this.config.thresholds.response_time_ms) {
        await this.sendAlert('WEB_SLOW_RESPONSE', 'Web response time exceeded threshold', 
          `Web responded in ${responseTime}ms (threshold: ${this.config.thresholds.response_time_ms}ms)`);
      }
      
      console.log(`✅ Web Health: ${this.metrics.web_health.status} (${responseTime}ms)`);
      
    } catch (error) {
      this.metrics.web_health = {
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      await this.sendAlert('WEB_DOWN', 'Web service is down', error.message);
      console.log(`❌ Web Health: down (${error.message})`);
    }
  }

  async checkMobileHealth() {
    try {
      // For mobile, we might check if the Expo dev server is running
      const startTime = Date.now();
      const response = await axios.get(this.config.mobile_url, { 
        timeout: 5000,
        validateStatus: () => true // Accept any status
      });
      const responseTime = Date.now() - startTime;
      
      this.metrics.mobile_health = {
        status: response.status < 500 ? 'healthy' : 'unhealthy',
        response_time: responseTime,
        timestamp: new Date().toISOString(),
        status_code: response.status
      };
      
      console.log(`✅ Mobile Health: ${this.metrics.mobile_health.status} (${responseTime}ms)`);
      
    } catch (error) {
      this.metrics.mobile_health = {
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      // Mobile might not always be running, so we'll just log this
      console.log(`⚠️  Mobile Health: down (${error.message})`);
    }
  }

  async checkSystemResources() {
    try {
      // Get CPU usage
      const cpuUsage = this.getCPUUsage();
      
      // Get memory usage
      const memoryUsage = this.getMemoryUsage();
      
      // Get disk usage
      const diskUsage = this.getDiskUsage();
      
      this.metrics.system_resources = {
        cpu_percent: cpuUsage,
        memory_percent: memoryUsage,
        disk_percent: diskUsage,
        timestamp: new Date().toISOString()
      };
      
      // Check thresholds
      if (cpuUsage > this.config.thresholds.cpu_percent) {
        await this.sendAlert('HIGH_CPU_USAGE', 'CPU usage exceeded threshold', 
          `CPU usage: ${cpuUsage}% (threshold: ${this.config.thresholds.cpu_percent}%)`);
      }
      
      if (memoryUsage > this.config.thresholds.memory_percent) {
        await this.sendAlert('HIGH_MEMORY_USAGE', 'Memory usage exceeded threshold', 
          `Memory usage: ${memoryUsage}% (threshold: ${this.config.thresholds.memory_percent}%)`);
      }
      
      if (diskUsage > this.config.thresholds.disk_percent) {
        await this.sendAlert('HIGH_DISK_USAGE', 'Disk usage exceeded threshold', 
          `Disk usage: ${diskUsage}% (threshold: ${this.config.thresholds.disk_percent}%)`);
      }
      
      console.log(`📊 System Resources: CPU ${cpuUsage}%, Memory ${memoryUsage}%, Disk ${diskUsage}%`);
      
    } catch (error) {
      console.warn('⚠️  Could not check system resources:', error.message);
    }
  }

  getCPUUsage() {
    try {
      // Get CPU usage using top command
      const output = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1", { encoding: 'utf8' });
      return parseFloat(output.trim()) || 0;
    } catch (error) {
      // Fallback method using /proc/loadavg
      try {
        const loadavg = fs.readFileSync('/proc/loadavg', 'utf8').trim().split(' ')[0];
        return Math.min(parseFloat(loadavg) * 100, 100); // Convert load to percentage (approximate)
      } catch (e) {
        return 0;
      }
    }
  }

  getMemoryUsage() {
    try {
      const output = execSync("free | grep Mem | awk '{printf \"%.0f\", $3/$2 * 100.0}'", { encoding: 'utf8' });
      return parseFloat(output.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  getDiskUsage() {
    try {
      const output = execSync("df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1", { encoding: 'utf8' });
      return parseFloat(output.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  async checkTestResults() {
    try {
      // Check for recent test results
      const testResultsPath = path.join(process.cwd(), 'test-results');
      
      if (fs.existsSync(testResultsPath)) {
        const files = fs.readdirSync(testResultsPath);
        const recentResults = {};
        
        // Look for recent test result files
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const filePath = path.join(testResultsPath, file);
            const stats = fs.statSync(filePath);
            const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
            
            if (ageHours < 1) { // Less than 1 hour old
              try {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                recentResults[file] = {
                  data: content,
                  age_hours: ageHours,
                  timestamp: stats.mtime.toISOString()
                };
              } catch (e) {
                // Invalid JSON, skip
              }
            }
          }
        });
        
        this.metrics.test_results = recentResults;
        
        // Check for test failures
        Object.entries(recentResults).forEach(([filename, result]) => {
          if (result.data.summary && result.data.summary.success_rate) {
            const successRate = result.data.summary.success_rate;
            if (successRate < this.config.thresholds.success_rate_percent) {
              this.sendAlert('TEST_FAILURE', 'Test success rate below threshold', 
                `Test success rate: ${successRate}% in ${filename} (threshold: ${this.config.thresholds.success_rate_percent}%)`);
            }
          }
        });
        
        console.log(`📋 Found ${Object.keys(recentResults).length} recent test results`);
      }
      
    } catch (error) {
      console.warn('⚠️  Could not check test results:', error.message);
    }
  }

  async evaluateAlerts() {
    // Remove old alerts (older than 24 hours)
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    this.metrics.alerts = this.metrics.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoffTime
    );
    
    // Clean up alert history
    for (const [key, timestamp] of this.alertHistory.entries()) {
      if (timestamp < cutoffTime) {
        this.alertHistory.delete(key);
      }
    }
  }

  async sendAlert(type, title, message) {
    const alertKey = `${type}_${Date.now()}`;
    const now = Date.now();
    
    // Check cooldown
    const lastAlert = this.alertHistory.get(type);
    if (lastAlert && (now - lastAlert) < this.config.alert_cooldown) {
      console.log(`⏳ Alert ${type} is in cooldown period`);
      return;
    }
    
    const alert = {
      id: alertKey,
      type: type,
      title: title,
      message: message,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type)
    };
    
    this.metrics.alerts.push(alert);
    this.alertHistory.set(type, now);
    
    console.log(`🚨 ALERT [${alert.severity}]: ${title} - ${message}`);
    
    // Send notifications
    await this.sendSlackNotification(alert);
    await this.sendEmailNotification(alert);
    
    return alert;
  }

  getAlertSeverity(type) {
    const criticalAlerts = ['API_DOWN', 'WEB_DOWN', 'HIGH_CPU_USAGE', 'HIGH_MEMORY_USAGE'];
    const warningAlerts = ['API_SLOW_RESPONSE', 'WEB_SLOW_RESPONSE', 'HIGH_DISK_USAGE'];
    
    if (criticalAlerts.includes(type)) return 'CRITICAL';
    if (warningAlerts.includes(type)) return 'WARNING';
    return 'INFO';
  }

  async sendSlackNotification(alert) {
    if (!this.config.slack_webhook) {
      return;
    }
    
    try {
      const color = {
        'CRITICAL': 'danger',
        'WARNING': 'warning',
        'INFO': 'good'
      }[alert.severity] || 'good';
      
      const payload = {
        channel: '#alerts',
        username: 'CRYB Test Monitor',
        icon_emoji: ':rotating_light:',
        attachments: [{
          color: color,
          title: `${alert.severity}: ${alert.title}`,
          text: alert.message,
          timestamp: Math.floor(new Date(alert.timestamp).getTime() / 1000),
          fields: [
            {
              title: 'Type',
              value: alert.type,
              short: true
            },
            {
              title: 'Timestamp',
              value: alert.timestamp,
              short: true
            }
          ]
        }]
      };
      
      await axios.post(this.config.slack_webhook, payload);
      console.log('📱 Slack notification sent');
      
    } catch (error) {
      console.warn('⚠️  Failed to send Slack notification:', error.message);
    }
  }

  async sendEmailNotification(alert) {
    if (!this.config.email_config.user || this.config.email_config.recipients.length === 0) {
      return;
    }
    
    try {
      // This would require a proper email library like nodemailer
      // For now, we'll just log what would be sent
      const subject = `CRYB Alert: ${alert.severity} - ${alert.title}`;
      const body = `
Alert Details:
- Type: ${alert.type}
- Severity: ${alert.severity}
- Title: ${alert.title}
- Message: ${alert.message}
- Timestamp: ${alert.timestamp}

This is an automated message from the CRYB Test Monitoring System.
      `;
      
      console.log(`📧 Email would be sent to: ${this.config.email_config.recipients.join(', ')}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      
    } catch (error) {
      console.warn('⚠️  Failed to send email notification:', error.message);
    }
  }

  async saveMetrics() {
    const metricsPath = path.join(process.cwd(), 'test-results', 'monitoring-metrics.json');
    const metricsDir = path.dirname(metricsPath);
    
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }
    
    try {
      fs.writeFileSync(metricsPath, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.warn('⚠️  Could not save metrics:', error.message);
    }
  }

  async loadMetrics() {
    const metricsPath = path.join(process.cwd(), 'test-results', 'monitoring-metrics.json');
    
    try {
      if (fs.existsSync(metricsPath)) {
        const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        this.metrics = { ...this.metrics, ...data };
        console.log('📂 Loaded previous metrics');
      }
    } catch (error) {
      console.warn('⚠️  Could not load previous metrics:', error.message);
    }
  }

  async generateMonitoringReport() {
    const report = {
      timestamp: new Date().toISOString(),
      monitoring_period: {
        start: this.metrics.last_check,
        end: new Date().toISOString()
      },
      summary: {
        total_alerts: this.metrics.alerts.length,
        critical_alerts: this.metrics.alerts.filter(a => a.severity === 'CRITICAL').length,
        warning_alerts: this.metrics.alerts.filter(a => a.severity === 'WARNING').length,
        info_alerts: this.metrics.alerts.filter(a => a.severity === 'INFO').length
      },
      services: {
        api: this.metrics.api_health,
        web: this.metrics.web_health,
        mobile: this.metrics.mobile_health
      },
      system_resources: this.metrics.system_resources,
      recent_alerts: this.metrics.alerts.slice(-10), // Last 10 alerts
      test_results: this.metrics.test_results,
      configuration: this.config
    };
    
    const reportPath = path.join(process.cwd(), 'test-results', 'monitoring-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Monitoring Report Generated:');
    console.log(`- Total Alerts: ${report.summary.total_alerts}`);
    console.log(`- Critical: ${report.summary.critical_alerts}`);
    console.log(`- Warning: ${report.summary.warning_alerts}`);
    console.log(`- Info: ${report.summary.info_alerts}`);
    console.log(`- Report saved to: ${reportPath}`);
    
    return report;
  }

  async getStatus() {
    return {
      is_running: this.isRunning,
      last_check: this.metrics.last_check,
      services: {
        api: this.metrics.api_health?.status || 'unknown',
        web: this.metrics.web_health?.status || 'unknown',
        mobile: this.metrics.mobile_health?.status || 'unknown'
      },
      alerts: {
        total: this.metrics.alerts.length,
        recent: this.metrics.alerts.slice(-5)
      },
      system: this.metrics.system_resources
    };
  }
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2] || 'start';
  const monitor = new TestMonitoringSystem();

  async function runCommand() {
    try {
      switch (command) {
        case 'start':
          await monitor.loadMetrics();
          await monitor.start();
          
          // Handle graceful shutdown
          process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            await monitor.stop();
            process.exit(0);
          });
          
          process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            await monitor.stop();
            process.exit(0);
          });
          
          // Keep the process running
          process.stdin.resume();
          break;

        case 'check':
          await monitor.loadMetrics();
          await monitor.performHealthCheck();
          const status = await monitor.getStatus();
          console.log('Current Status:', JSON.stringify(status, null, 2));
          break;

        case 'status':
          await monitor.loadMetrics();
          const currentStatus = await monitor.getStatus();
          console.log(JSON.stringify(currentStatus, null, 2));
          break;

        case 'report':
          await monitor.loadMetrics();
          await monitor.generateMonitoringReport();
          break;

        case 'test-alert':
          await monitor.sendAlert('TEST_ALERT', 'Test Alert', 'This is a test alert to verify the notification system');
          break;

        default:
          console.log(`
Usage: node test-monitoring.js <command>

Commands:
  start        - Start continuous monitoring (default)
  check        - Perform single health check
  status       - Show current status
  report       - Generate monitoring report
  test-alert   - Send test alert

Environment Variables:
  SLACK_WEBHOOK_URL    - Slack webhook for alerts
  EMAIL_USER          - Email user for notifications
  EMAIL_PASSWORD      - Email password
  EMAIL_RECIPIENTS    - Comma-separated email addresses
  API_URL             - API service URL (default: http://localhost:4000)
  WEB_URL             - Web service URL (default: http://localhost:3000)
  MOBILE_URL          - Mobile service URL (default: http://localhost:8081)

Examples:
  node test-monitoring.js start
  node test-monitoring.js check
  node test-monitoring.js status
          `);
          break;
      }

    } catch (error) {
      console.error('Command failed:', error.message);
      process.exit(1);
    }
  }

  runCommand();
}

module.exports = TestMonitoringSystem;