/**
 * CRYB Security Metrics Exporter
 * Collects and exports security metrics from various security tools
 */

const express = require('express');
const client = require('prom-client');
const cron = require('node-cron');
const winston = require('winston');
const axios = require('axios');
const fs = require('fs-extra');
const { Tail } = require('tail');
const geoip = require('geoip-lite');
const moment = require('moment');
const NodeCache = require('node-cache');

// Initialize metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Cache for storing temporary data
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/var/log/security-exporter.log' })
  ]
});

// =====================================
// PROMETHEUS METRICS DEFINITIONS
// =====================================

// Wazuh Metrics
const wazuhAlertsTotal = new client.Counter({
  name: 'wazuh_alerts_total',
  help: 'Total number of Wazuh security alerts',
  labelNames: ['level', 'rule_id', 'rule_description', 'agent_name']
});

const wazuhAgentsConnected = new client.Gauge({
  name: 'wazuh_agents_connected',
  help: 'Number of connected Wazuh agents'
});

const wazuhRuleGroupsTotal = new client.Counter({
  name: 'wazuh_rule_groups_total',
  help: 'Total alerts by rule group',
  labelNames: ['group']
});

// Fail2Ban Metrics
const fail2banBansTotal = new client.Counter({
  name: 'fail2ban_bans_total',
  help: 'Total number of IP bans by Fail2Ban',
  labelNames: ['jail', 'action']
});

const fail2banBannedIPs = new client.Gauge({
  name: 'fail2ban_banned_ips',
  help: 'Currently banned IP addresses',
  labelNames: ['jail', 'ip', 'country']
});

// Suricata Metrics
const suricataAlertsTotal = new client.Counter({
  name: 'suricata_alerts_total',
  help: 'Total Suricata IDS alerts',
  labelNames: ['signature', 'category', 'severity', 'protocol']
});

const suricataFlowsTotal = new client.Counter({
  name: 'suricata_flows_total',
  help: 'Total network flows processed by Suricata',
  labelNames: ['protocol', 'state']
});

// ClamAV Metrics
const clamavScansTotal = new client.Counter({
  name: 'clamav_scans_total',
  help: 'Total file scans performed by ClamAV',
  labelNames: ['result']
});

const clamavThreatsTotal = new client.Counter({
  name: 'clamav_threats_total',
  help: 'Total threats detected by ClamAV',
  labelNames: ['threat_name']
});

// Security Intelligence Metrics
const securityIntelligenceIndicators = new client.Gauge({
  name: 'security_intelligence_indicators',
  help: 'Security intelligence indicators count',
  labelNames: ['type', 'source']
});

const threatScoreHistogram = new client.Histogram({
  name: 'threat_score_histogram',
  help: 'Distribution of threat scores',
  buckets: [0.1, 0.3, 0.5, 0.7, 0.9, 1.0]
});

// Attack Pattern Metrics
const attackPatternsTotal = new client.Counter({
  name: 'attack_patterns_total',
  help: 'Detected attack patterns',
  labelNames: ['pattern_type', 'technique', 'tactic']
});

// Geographic Threat Distribution
const geographicThreats = new client.Counter({
  name: 'geographic_threats_total',
  help: 'Threats by geographic location',
  labelNames: ['country', 'region', 'threat_type']
});

// Register all metrics
register.registerMetric(wazuhAlertsTotal);
register.registerMetric(wazuhAgentsConnected);
register.registerMetric(wazuhRuleGroupsTotal);
register.registerMetric(fail2banBansTotal);
register.registerMetric(fail2banBannedIPs);
register.registerMetric(suricataAlertsTotal);
register.registerMetric(suricataFlowsTotal);
register.registerMetric(clamavScansTotal);
register.registerMetric(clamavThreatsTotal);
register.registerMetric(securityIntelligenceIndicators);
register.registerMetric(threatScoreHistogram);
register.registerMetric(attackPatternsTotal);
register.registerMetric(geographicThreats);

// =====================================
// WAZUH API CLIENT
// =====================================
class WazuhAPIClient {
  constructor() {
    this.baseURL = process.env.WAZUH_API_URL || 'https://wazuh-manager:55000';
    this.username = process.env.WAZUH_API_USER || 'wazuh-wui';
    this.password = process.env.WAZUH_API_PASSWORD || 'MyS3cr37P450r.*-';
    this.token = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/security/user/authenticate`, 
        {}, 
        {
          auth: {
            username: this.username,
            password: this.password
          },
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false
          })
        }
      );
      this.token = response.data.data.token;
      logger.info('Wazuh API authentication successful');
    } catch (error) {
      logger.error('Wazuh API authentication failed:', error.message);
      throw error;
    }
  }

  async request(endpoint) {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, re-authenticate
        await this.authenticate();
        return this.request(endpoint);
      }
      throw error;
    }
  }

  async getAgents() {
    return this.request('/agents');
  }

  async getAlerts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/security/alerts?${queryString}`);
  }

  async getRules() {
    return this.request('/rules');
  }
}

const wazuhClient = new WazuhAPIClient();

// =====================================
// LOG PARSERS
// =====================================

// Fail2Ban log parser
function parseFail2BanLog(line) {
  const banPattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) fail2ban\.actions\s+\[(\d+)\]: NOTICE\s+\[(\w+)\] Ban (.+)/;
  const unbanPattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) fail2ban\.actions\s+\[(\d+)\]: NOTICE\s+\[(\w+)\] Unban (.+)/;
  
  let match = line.match(banPattern);
  if (match) {
    const [, timestamp, pid, jail, ip] = match;
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : 'Unknown';
    
    fail2banBansTotal.labels(jail, 'ban').inc();
    fail2banBannedIPs.labels(jail, ip, country).set(1);
    
    geographicThreats.labels(country, geo?.region || 'Unknown', 'network_ban').inc();
    
    logger.info(`Fail2Ban ban detected: ${ip} in jail ${jail}, country: ${country}`);
    return { type: 'ban', jail, ip, country, timestamp };
  }
  
  match = line.match(unbanPattern);
  if (match) {
    const [, timestamp, pid, jail, ip] = match;
    fail2banBansTotal.labels(jail, 'unban').inc();
    fail2banBannedIPs.labels(jail, ip, 'Unknown').set(0);
    
    logger.info(`Fail2Ban unban detected: ${ip} from jail ${jail}`);
    return { type: 'unban', jail, ip, timestamp };
  }
  
  return null;
}

// Suricata log parser
function parseSuricataLog(line) {
  try {
    const event = JSON.parse(line);
    
    if (event.event_type === 'alert') {
      const { alert, src_ip, dest_ip, proto, flow } = event;
      
      suricataAlertsTotal.labels(
        alert.signature || 'unknown',
        alert.category || 'unknown',
        alert.severity?.toString() || 'unknown',
        proto || 'unknown'
      ).inc();
      
      // Analyze attack patterns
      const technique = extractAttackTechnique(alert.signature);
      const tactic = extractAttackTactic(alert.category);
      
      attackPatternsTotal.labels('signature_based', technique, tactic).inc();
      
      // Calculate threat score based on severity and metadata
      const threatScore = calculateThreatScore(alert);
      threatScoreHistogram.observe(threatScore);
      
      // Geographic analysis
      const srcGeo = geoip.lookup(src_ip);
      if (srcGeo) {
        geographicThreats.labels(srcGeo.country, srcGeo.region, 'network_intrusion').inc();
      }
      
      logger.info(`Suricata alert: ${alert.signature} from ${src_ip} to ${dest_ip}`);
      return event;
    }
    
    if (event.event_type === 'flow') {
      suricataFlowsTotal.labels(event.proto || 'unknown', event.flow?.state || 'unknown').inc();
    }
    
    return event;
  } catch (error) {
    logger.error('Failed to parse Suricata log:', error.message);
    return null;
  }
}

// ClamAV log parser
function parseClamAVLog(line) {
  const scanPattern = /(.+): (.+) FOUND/;
  const cleanPattern = /(.+): OK/;
  
  let match = line.match(scanPattern);
  if (match) {
    const [, file, threat] = match;
    clamavScansTotal.labels('infected').inc();
    clamavThreatsTotal.labels(threat).inc();
    
    logger.warn(`ClamAV threat detected: ${threat} in ${file}`);
    return { type: 'threat', file, threat };
  }
  
  match = line.match(cleanPattern);
  if (match) {
    clamavScansTotal.labels('clean').inc();
    return { type: 'clean', file: match[1] };
  }
  
  return null;
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

function extractAttackTechnique(signature) {
  // Extract MITRE ATT&CK techniques from signatures
  const techniques = {
    'brute.?force': 'T1110',
    'sql.?injection': 'T1190',
    'xss': 'T1189',
    'rce': 'T1190',
    'backdoor': 'T1105',
    'malware': 'T1105',
    'trojan': 'T1105'
  };
  
  const sig = signature.toLowerCase();
  for (const [pattern, technique] of Object.entries(techniques)) {
    if (new RegExp(pattern).test(sig)) {
      return technique;
    }
  }
  
  return 'unknown';
}

function extractAttackTactic(category) {
  // Map categories to MITRE ATT&CK tactics
  const tactics = {
    'attempted-recon': 'reconnaissance',
    'attempted-dos': 'impact',
    'attempted-user': 'initial-access',
    'attempted-admin': 'privilege-escalation',
    'trojan-activity': 'execution',
    'web-application-attack': 'initial-access',
    'attempted-access': 'credential-access'
  };
  
  return tactics[category] || 'unknown';
}

function calculateThreatScore(alert) {
  let score = 0;
  
  // Base score from severity
  const severity = parseInt(alert.severity) || 1;
  score += severity / 3; // Normalize to 0-1
  
  // Increase score based on keywords
  const highRiskKeywords = ['exploit', 'backdoor', 'trojan', 'malware', 'rce'];
  const signature = alert.signature.toLowerCase();
  
  for (const keyword of highRiskKeywords) {
    if (signature.includes(keyword)) {
      score += 0.2;
    }
  }
  
  return Math.min(score, 1.0);
}

// =====================================
// DATA COLLECTORS
// =====================================

async function collectWazuhMetrics() {
  try {
    // Get agent status
    const agentsResponse = await wazuhClient.getAgents();
    const connectedAgents = agentsResponse.data.affected_items.filter(agent => agent.status === 'active').length;
    wazuhAgentsConnected.set(connectedAgents);
    
    // Get recent alerts
    const alertsResponse = await wazuhClient.getAlerts({
      limit: 1000,
      offset: 0,
      sort: '-timestamp'
    });
    
    if (alertsResponse.data?.affected_items) {
      for (const alert of alertsResponse.data.affected_items) {
        const level = alert.rule?.level?.toString() || 'unknown';
        const ruleId = alert.rule?.id?.toString() || 'unknown';
        const ruleDescription = alert.rule?.description || 'unknown';
        const agentName = alert.agent?.name || 'unknown';
        
        wazuhAlertsTotal.labels(level, ruleId, ruleDescription, agentName).inc();
        
        // Group classification
        if (alert.rule?.groups) {
          for (const group of alert.rule.groups) {
            wazuhRuleGroupsTotal.labels(group).inc();
          }
        }
      }
    }
    
    logger.info(`Collected metrics for ${connectedAgents} Wazuh agents`);
  } catch (error) {
    logger.error('Failed to collect Wazuh metrics:', error.message);
  }
}

async function collectSecurityIntelligence() {
  try {
    // Simulate threat intelligence feed
    const indicators = {
      'ip': cache.get('malicious_ips') || 150,
      'domain': cache.get('malicious_domains') || 75,
      'hash': cache.get('malicious_hashes') || 200,
      'url': cache.get('malicious_urls') || 100
    };
    
    for (const [type, count] of Object.entries(indicators)) {
      securityIntelligenceIndicators.labels(type, 'threat_feed').set(count);
    }
    
    logger.info('Updated security intelligence indicators');
  } catch (error) {
    logger.error('Failed to collect security intelligence:', error.message);
  }
}

// =====================================
// LOG WATCHERS
// =====================================

function setupLogWatchers() {
  const logFiles = [
    {
      path: process.env.FAIL2BAN_LOG_PATH || '/var/log/fail2ban/fail2ban.log',
      parser: parseFail2BanLog,
      name: 'fail2ban'
    },
    {
      path: process.env.SURICATA_LOG_PATH || '/var/log/suricata/eve.json',
      parser: parseSuricataLog,
      name: 'suricata'
    },
    {
      path: process.env.CLAMAV_LOG_PATH || '/var/log/clamav/clamav.log',
      parser: parseClamAVLog,
      name: 'clamav'
    }
  ];
  
  for (const logConfig of logFiles) {
    if (fs.existsSync(logConfig.path)) {
      const tail = new Tail(logConfig.path, { 
        fromBeginning: false,
        follow: true,
        logger: console
      });
      
      tail.on('line', (line) => {
        try {
          const parsed = logConfig.parser(line);
          if (parsed) {
            logger.debug(`Parsed ${logConfig.name} log entry:`, parsed);
          }
        } catch (error) {
          logger.error(`Error parsing ${logConfig.name} log:`, error.message);
        }
      });
      
      tail.on('error', (error) => {
        logger.error(`Error watching ${logConfig.name} log:`, error.message);
      });
      
      logger.info(`Started watching ${logConfig.name} log: ${logConfig.path}`);
    } else {
      logger.warn(`Log file not found: ${logConfig.path}`);
    }
  }
}

// =====================================
// EXPRESS SERVER
// =====================================

const app = express();
const port = process.env.PORT || 9200;

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('../package.json').version
  });
});

app.get('/status', async (req, res) => {
  try {
    const agentsResponse = await wazuhClient.getAgents();
    const connectedAgents = agentsResponse.data.affected_items.filter(agent => agent.status === 'active').length;
    
    res.json({
      security_monitoring: {
        wazuh_agents: connectedAgents,
        monitoring_active: true,
        log_watchers: ['fail2ban', 'suricata', 'clamav'],
        last_collection: cache.get('last_collection') || 'never'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// STARTUP
// =====================================

async function startup() {
  logger.info('Starting CRYB Security Exporter...');
  
  // Setup log watchers
  setupLogWatchers();
  
  // Schedule metric collection
  cron.schedule('*/1 * * * *', async () => {
    logger.info('Collecting security metrics...');
    await collectWazuhMetrics();
    await collectSecurityIntelligence();
    cache.set('last_collection', new Date().toISOString());
  });
  
  // Initial collection
  setTimeout(() => {
    collectWazuhMetrics();
    collectSecurityIntelligence();
  }, 5000);
  
  // Start server
  app.listen(port, () => {
    logger.info(`Security exporter listening on port ${port}`);
    logger.info(`Metrics endpoint: http://localhost:${port}/metrics`);
    logger.info(`Health endpoint: http://localhost:${port}/health`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the application
startup().catch((error) => {
  logger.error('Failed to start security exporter:', error);
  process.exit(1);
});