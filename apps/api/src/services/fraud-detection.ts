import { AIIntegrationService } from './ai-integration';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import axios from 'axios';

export interface FraudDetectionConfig {
  thresholds: {
    highRiskScore: number;
    suspiciousAmount: number;
    rapidTransactionCount: number;
    newAccountDays: number;
    velocityLimit: number;
  };
  monitoring: {
    enableRealTime: boolean;
    checkBlacklists: boolean;
    analyzePatterns: boolean;
    trackVelocity: boolean;
    verifyAddresses: boolean;
  };
  blockchains: {
    ethereum: {
      enabled: boolean;
      rpcUrl: string;
      explorerApi: string;
    };
    bitcoin: {
      enabled: boolean;
      rpcUrl: string;
      explorerApi: string;
    };
    polygon: {
      enabled: boolean;
      rpcUrl: string;
      explorerApi: string;
    };
  };
  actions: {
    autoFreeze: boolean;
    requireVerification: boolean;
    notifyModerators: boolean;
    escalateToManual: boolean;
  };
}

export interface TransactionData {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'tip' | 'payment' | 'trade';
  amount: number;
  currency: string;
  fromAddress?: string;
  toAddress?: string;
  transactionHash?: string;
  blockchain?: string;
  timestamp: Date;
  metadata: {
    serverId?: string;
    channelId?: string;
    recipientId?: string;
    purpose?: string;
    notes?: string;
  };
}

export interface UserRiskProfile {
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    accountAge: number;
    verificationLevel: 'none' | 'basic' | 'enhanced' | 'premium';
    transactionHistory: number;
    averageAmount: number;
    suspiciousCount: number;
    flaggedAddresses: number;
    socialScore: number;
    reputationScore: number;
  };
  patterns: {
    preferredTimes: number[];
    commonAmounts: number[];
    frequentAddresses: string[];
    behaviorAnomalies: string[];
  };
  lastUpdate: Date;
}

export interface FraudAnalysisResult {
  transactionId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  flags: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidence: any;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }>;
  addressAnalysis: {
    fromAddress?: AddressRiskAnalysis;
    toAddress?: AddressRiskAnalysis;
  };
  patternAnalysis: {
    velocityCheck: boolean;
    amountAnomaly: boolean;
    timeAnomaly: boolean;
    behaviorAnomaly: boolean;
  };
  externalChecks: {
    blacklistHit: boolean;
    sanctionsList: boolean;
    knownScam: boolean;
    mixerService: boolean;
  };
  processingTime: number;
  blocked: boolean;
}

export interface AddressRiskAnalysis {
  address: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  metadata: {
    balance: number;
    transactionCount: number;
    firstSeen: Date;
    lastActive: Date;
    labels: string[];
    cluster?: string;
  };
  reputation: {
    exchangeRating: number;
    communityReports: number;
    blacklistStatus: boolean;
    whitelistStatus: boolean;
  };
}

export interface FraudPattern {
  id: string;
  name: string;
  description: string;
  type: 'velocity' | 'amount' | 'behavior' | 'address' | 'timing' | 'network';
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    weight: number;
  }>;
  riskScore: number;
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

export class FraudDetectionService {
  private aiService: AIIntegrationService;
  private queue: Queue;
  private config: FraudDetectionConfig;
  
  // Data structures
  private userProfiles: Map<string, UserRiskProfile> = new Map();
  private addressCache: Map<string, { analysis: AddressRiskAnalysis; timestamp: number }> = new Map();
  private transactionHistory: Map<string, TransactionData[]> = new Map();
  private fraudPatterns: Map<string, FraudPattern> = new Map();
  private blacklistedAddresses: Set<string> = new Set();
  private whitelistedAddresses: Set<string> = new Set();
  
  // Real-time monitoring
  private velocityTracker: Map<string, Array<{ amount: number; timestamp: Date }>> = new Map();
  private suspiciousTransactions: Map<string, FraudAnalysisResult> = new Map();

  constructor(aiService: AIIntegrationService, moderationQueue: Queue) {
    this.aiService = aiService;
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    
    this.initializeFraudPatterns();
    this.loadBlacklists();
    this.startRealTimeMonitoring();
  }

  /**
   * Analyze a crypto transaction for fraud risk
   */
  async analyzeTransaction(transaction: TransactionData): Promise<FraudAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Get or create user risk profile
      const userProfile = await this.getUserRiskProfile(transaction.userId);
      
      // Initialize analysis result
      const analysis: FraudAnalysisResult = {
        transactionId: transaction.id,
        riskScore: 0,
        riskLevel: 'low',
        confidence: 0,
        flags: [],
        recommendations: [],
        addressAnalysis: {},
        patternAnalysis: {
          velocityCheck: false,
          amountAnomaly: false,
          timeAnomaly: false,
          behaviorAnomaly: false
        },
        externalChecks: {
          blacklistHit: false,
          sanctionsList: false,
          knownScam: false,
          mixerService: false
        },
        processingTime: 0,
        blocked: false
      };

      // Parallel analysis execution
      const analyses = await Promise.allSettled([
        this.analyzeUserRisk(transaction, userProfile),
        this.analyzeAddresses(transaction),
        this.analyzeTransactionPatterns(transaction, userProfile),
        this.performExternalChecks(transaction),
        this.analyzeVelocity(transaction.userId, transaction.amount),
        this.detectAnomalies(transaction, userProfile)
      ]);

      // Combine analysis results
      this.combineAnalysisResults(analysis, analyses);

      // Calculate final risk score and level
      analysis.riskScore = this.calculateFinalRiskScore(analysis);
      analysis.riskLevel = this.calculateRiskLevel(analysis.riskScore);
      analysis.confidence = this.calculateConfidence(analysis);

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      // Determine if transaction should be blocked
      analysis.blocked = this.shouldBlockTransaction(analysis);

      // Update user profile
      await this.updateUserProfile(transaction.userId, transaction, analysis);

      // Take actions if necessary
      if (analysis.blocked || analysis.riskLevel === 'critical') {
        await this.executeSecurityActions(transaction, analysis);
      }

      analysis.processingTime = Date.now() - startTime;

      // Log analysis
      await this.logFraudAnalysis(transaction, analysis);

      return analysis;
    } catch (error) {
      console.error('Fraud analysis failed:', error);
      return this.createSafeAnalysisResult(transaction.id, startTime);
    }
  }

  /**
   * Analyze user risk factors
   */
  private async analyzeUserRisk(
    transaction: TransactionData,
    userProfile: UserRiskProfile
  ): Promise<{
    riskScore: number;
    flags: Array<{ type: string; severity: string; description: string; evidence: any }>;
  }> {
    const flags: Array<{ type: string; severity: string; description: string; evidence: any }> = [];
    let riskScore = 0;

    // Account age risk
    const accountAgeDays = userProfile.factors.accountAge;
    if (accountAgeDays < this.config.thresholds.newAccountDays) {
      const severity = accountAgeDays < 1 ? 'high' : accountAgeDays < 7 ? 'medium' : 'low';
      flags.push({
        type: 'new_account',
        severity,
        description: `Account is only ${accountAgeDays} days old`,
        evidence: { accountAge: accountAgeDays }
      });
      riskScore += accountAgeDays < 1 ? 0.4 : accountAgeDays < 7 ? 0.2 : 0.1;
    }

    // Verification level risk
    if (userProfile.factors.verificationLevel === 'none') {
      flags.push({
        type: 'unverified_account',
        severity: 'medium',
        description: 'Account has no verification',
        evidence: { verificationLevel: userProfile.factors.verificationLevel }
      });
      riskScore += 0.3;
    }

    // Transaction history risk
    if (userProfile.factors.transactionHistory < 5 && transaction.amount > 1000) {
      flags.push({
        type: 'inexperienced_high_value',
        severity: 'high',
        description: 'High-value transaction from user with limited history',
        evidence: { 
          transactionHistory: userProfile.factors.transactionHistory,
          amount: transaction.amount 
        }
      });
      riskScore += 0.5;
    }

    // Suspicious activity history
    if (userProfile.factors.suspiciousCount > 0) {
      const severity = userProfile.factors.suspiciousCount > 5 ? 'high' : 
                     userProfile.factors.suspiciousCount > 2 ? 'medium' : 'low';
      flags.push({
        type: 'suspicious_history',
        severity,
        description: `User has ${userProfile.factors.suspiciousCount} previous suspicious activities`,
        evidence: { suspiciousCount: userProfile.factors.suspiciousCount }
      });
      riskScore += Math.min(userProfile.factors.suspiciousCount * 0.1, 0.5);
    }

    // Low reputation risk
    if (userProfile.factors.reputationScore < 0.3) {
      flags.push({
        type: 'low_reputation',
        severity: 'medium',
        description: 'User has low community reputation',
        evidence: { reputationScore: userProfile.factors.reputationScore }
      });
      riskScore += 0.2;
    }

    return { riskScore: Math.min(riskScore, 1), flags };
  }

  /**
   * Analyze transaction addresses for risk
   */
  private async analyzeAddresses(transaction: TransactionData): Promise<{
    addressAnalysis: { fromAddress?: AddressRiskAnalysis; toAddress?: AddressRiskAnalysis };
    flags: Array<{ type: string; severity: string; description: string; evidence: any }>;
  }> {
    const flags: Array<{ type: string; severity: string; description: string; evidence: any }> = [];
    const addressAnalysis: { fromAddress?: AddressRiskAnalysis; toAddress?: AddressRiskAnalysis } = {};

    // Analyze from address
    if (transaction.fromAddress) {
      const fromAnalysis = await this.analyzeAddress(transaction.fromAddress, transaction.blockchain);
      addressAnalysis.fromAddress = fromAnalysis;
      
      if (fromAnalysis.riskLevel === 'high' || fromAnalysis.riskLevel === 'critical') {
        flags.push({
          type: 'risky_from_address',
          severity: fromAnalysis.riskLevel,
          description: `From address has ${fromAnalysis.riskLevel} risk level`,
          evidence: { address: transaction.fromAddress, flags: fromAnalysis.flags }
        });
      }
    }

    // Analyze to address
    if (transaction.toAddress) {
      const toAnalysis = await this.analyzeAddress(transaction.toAddress, transaction.blockchain);
      addressAnalysis.toAddress = toAnalysis;
      
      if (toAnalysis.riskLevel === 'high' || toAnalysis.riskLevel === 'critical') {
        flags.push({
          type: 'risky_to_address',
          severity: toAnalysis.riskLevel,
          description: `To address has ${toAnalysis.riskLevel} risk level`,
          evidence: { address: transaction.toAddress, flags: toAnalysis.flags }
        });
      }
    }

    return { addressAnalysis, flags };
  }

  /**
   * Analyze individual address for risk factors
   */
  private async analyzeAddress(address: string, blockchain?: string): Promise<AddressRiskAnalysis> {
    try {
      // Check cache first
      const cached = this.addressCache.get(address);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
        return cached.analysis;
      }

      const analysis: AddressRiskAnalysis = {
        address,
        riskScore: 0,
        riskLevel: 'low',
        flags: [],
        metadata: {
          balance: 0,
          transactionCount: 0,
          firstSeen: new Date(),
          lastActive: new Date(),
          labels: []
        },
        reputation: {
          exchangeRating: 0.5,
          communityReports: 0,
          blacklistStatus: false,
          whitelistStatus: false
        }
      };

      // Check blacklist/whitelist
      if (this.blacklistedAddresses.has(address)) {
        analysis.riskScore = 1.0;
        analysis.riskLevel = 'critical';
        analysis.flags.push('blacklisted');
        analysis.reputation.blacklistStatus = true;
      } else if (this.whitelistedAddresses.has(address)) {
        analysis.riskScore = 0.1;
        analysis.riskLevel = 'low';
        analysis.reputation.whitelistStatus = true;
      } else {
        // Perform blockchain analysis
        await this.performBlockchainAnalysis(analysis, blockchain);
      }

      // Cache result
      this.addressCache.set(address, { analysis, timestamp: Date.now() });

      return analysis;
    } catch (error) {
      console.error(`Address analysis failed for ${address}:`, error);
      return {
        address,
        riskScore: 0.5, // Default to medium risk on error
        riskLevel: 'medium',
        flags: ['analysis_failed'],
        metadata: {
          balance: 0,
          transactionCount: 0,
          firstSeen: new Date(),
          lastActive: new Date(),
          labels: []
        },
        reputation: {
          exchangeRating: 0.5,
          communityReports: 0,
          blacklistStatus: false,
          whitelistStatus: false
        }
      };
    }
  }

  /**
   * Perform blockchain analysis on address
   */
  private async performBlockchainAnalysis(
    analysis: AddressRiskAnalysis,
    blockchain?: string
  ): Promise<void> {
    try {
      if (blockchain === 'ethereum' && this.config.blockchains.ethereum.enabled) {
        await this.analyzeEthereumAddress(analysis);
      } else if (blockchain === 'bitcoin' && this.config.blockchains.bitcoin.enabled) {
        await this.analyzeBitcoinAddress(analysis);
      }

      // Common risk indicators
      this.applyCommonRiskIndicators(analysis);
    } catch (error) {
      console.error('Blockchain analysis failed:', error);
    }
  }

  /**
   * Analyze Ethereum address
   */
  private async analyzeEthereumAddress(analysis: AddressRiskAnalysis): Promise<void> {
    try {
      const { address } = analysis;
      
      // Get address info from Etherscan-like API
      const response = await axios.get(`${this.config.blockchains.ethereum.explorerApi}/api`, {
        params: {
          module: 'account',
          action: 'balance',
          address,
          tag: 'latest'
        },
        timeout: 5000
      });

      if (response.data.status === '1') {
        const balanceWei = BigInt(response.data.result);
        analysis.metadata.balance = Number(balanceWei) / Math.pow(10, 18); // Convert to ETH
      }

      // Get transaction count
      const txCountResponse = await axios.get(`${this.config.blockchains.ethereum.explorerApi}/api`, {
        params: {
          module: 'proxy',
          action: 'eth_getTransactionCount',
          address,
          tag: 'latest'
        },
        timeout: 5000
      });

      if (txCountResponse.data.result) {
        analysis.metadata.transactionCount = parseInt(txCountResponse.data.result, 16);
      }

    } catch (error) {
      console.error('Ethereum address analysis failed:', error);
    }
  }

  /**
   * Analyze Bitcoin address
   */
  private async analyzeBitcoinAddress(analysis: AddressRiskAnalysis): Promise<void> {
    try {
      // Bitcoin address analysis would go here
      // This is a placeholder for Bitcoin-specific analysis
      console.log(`Analyzing Bitcoin address: ${analysis.address}`);
    } catch (error) {
      console.error('Bitcoin address analysis failed:', error);
    }
  }

  /**
   * Apply common risk indicators to address analysis
   */
  private applyCommonRiskIndicators(analysis: AddressRiskAnalysis): void {
    let riskScore = 0;
    const flags: string[] = [];

    // Very new address with high activity
    const daysSinceFirstSeen = (Date.now() - analysis.metadata.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceFirstSeen < 1 && analysis.metadata.transactionCount > 50) {
      riskScore += 0.6;
      flags.push('new_high_activity');
    }

    // High balance with low transaction count (possible accumulation address)
    if (analysis.metadata.balance > 100 && analysis.metadata.transactionCount < 5) {
      riskScore += 0.3;
      flags.push('high_balance_low_activity');
    }

    // Very high transaction count (possible mixer or exchange)
    if (analysis.metadata.transactionCount > 10000) {
      riskScore += 0.2;
      flags.push('very_high_activity');
      analysis.metadata.labels.push('high_volume');
    }

    // Check for known risky patterns in address
    if (this.isAddressSuspicious(analysis.address)) {
      riskScore += 0.4;
      flags.push('suspicious_pattern');
    }

    analysis.riskScore = Math.min(riskScore, 1);
    analysis.flags.push(...flags);
    analysis.riskLevel = this.calculateRiskLevel(analysis.riskScore);
  }

  /**
   * Check if address matches suspicious patterns
   */
  private isAddressSuspicious(address: string): boolean {
    // Check for patterns that might indicate suspicious activity
    const suspiciousPatterns = [
      /^0x00000000/i, // Null-like addresses
      /(.)\1{8,}/, // Repeated characters
      /^0x[0-9a-f]{8}0{32}$/i, // Specific suspicious patterns
    ];

    return suspiciousPatterns.some(pattern => pattern.test(address));
  }

  /**
   * Analyze transaction patterns
   */
  private async analyzeTransactionPatterns(
    transaction: TransactionData,
    userProfile: UserRiskProfile
  ): Promise<{
    patternAnalysis: {
      velocityCheck: boolean;
      amountAnomaly: boolean;
      timeAnomaly: boolean;
      behaviorAnomaly: boolean;
    };
    flags: Array<{ type: string; severity: string; description: string; evidence: any }>;
  }> {
    const flags: Array<{ type: string; severity: string; description: string; evidence: any }> = [];
    const patternAnalysis = {
      velocityCheck: false,
      amountAnomaly: false,
      timeAnomaly: false,
      behaviorAnomaly: false
    };

    // Amount anomaly detection
    if (transaction.amount > userProfile.factors.averageAmount * 10) {
      patternAnalysis.amountAnomaly = true;
      flags.push({
        type: 'amount_anomaly',
        severity: 'high',
        description: `Transaction amount is ${Math.round(transaction.amount / userProfile.factors.averageAmount)}x higher than user's average`,
        evidence: { 
          amount: transaction.amount,
          averageAmount: userProfile.factors.averageAmount 
        }
      });
    }

    // Time anomaly detection
    const hour = transaction.timestamp.getHours();
    if (!userProfile.patterns.preferredTimes.includes(hour)) {
      patternAnalysis.timeAnomaly = true;
      flags.push({
        type: 'time_anomaly',
        severity: 'low',
        description: `Transaction at unusual time (${hour}:00) for user`,
        evidence: { 
          transactionHour: hour,
          preferredTimes: userProfile.patterns.preferredTimes 
        }
      });
    }

    // Behavioral anomaly detection
    const userTransactions = this.transactionHistory.get(transaction.userId) || [];
    if (userTransactions.length > 0) {
      const behaviorScore = this.calculateBehaviorAnomalyScore(transaction, userTransactions);
      if (behaviorScore > 0.7) {
        patternAnalysis.behaviorAnomaly = true;
        flags.push({
          type: 'behavior_anomaly',
          severity: 'medium',
          description: `Transaction behavior significantly differs from user's pattern`,
          evidence: { behaviorScore }
        });
      }
    }

    return { patternAnalysis, flags };
  }

  /**
   * Calculate behavior anomaly score
   */
  private calculateBehaviorAnomalyScore(
    transaction: TransactionData,
    userHistory: TransactionData[]
  ): number {
    let anomalyScore = 0;

    // Check transaction type frequency
    const typeFreq = userHistory.filter(t => t.type === transaction.type).length / userHistory.length;
    if (typeFreq < 0.1) { // Less than 10% of transactions are this type
      anomalyScore += 0.3;
    }

    // Check currency usage
    const currencyFreq = userHistory.filter(t => t.currency === transaction.currency).length / userHistory.length;
    if (currencyFreq < 0.2) { // Less than 20% of transactions use this currency
      anomalyScore += 0.2;
    }

    // Check destination address novelty
    if (transaction.toAddress) {
      const addressFreq = userHistory.filter(t => t.toAddress === transaction.toAddress).length;
      if (addressFreq === 0) { // Never sent to this address before
        anomalyScore += 0.3;
      }
    }

    return Math.min(anomalyScore, 1);
  }

  /**
   * Perform external fraud checks
   */
  private async performExternalChecks(transaction: TransactionData): Promise<{
    externalChecks: {
      blacklistHit: boolean;
      sanctionsList: boolean;
      knownScam: boolean;
      mixerService: boolean;
    };
    flags: Array<{ type: string; severity: string; description: string; evidence: any }>;
  }> {
    const flags: Array<{ type: string; severity: string; description: string; evidence: any }> = [];
    const externalChecks = {
      blacklistHit: false,
      sanctionsList: false,
      knownScam: false,
      mixerService: false
    };

    try {
      // Check addresses against various lists
      const addressesToCheck = [transaction.fromAddress, transaction.toAddress].filter(Boolean);
      
      for (const address of addressesToCheck) {
        // Blacklist check
        if (this.blacklistedAddresses.has(address!)) {
          externalChecks.blacklistHit = true;
          flags.push({
            type: 'blacklisted_address',
            severity: 'critical',
            description: `Address ${address} is on blacklist`,
            evidence: { address }
          });
        }

        // Known scam check (simplified)
        if (await this.isKnownScamAddress(address!)) {
          externalChecks.knownScam = true;
          flags.push({
            type: 'known_scam',
            severity: 'critical',
            description: `Address ${address} associated with known scams`,
            evidence: { address }
          });
        }

        // Mixer service check
        if (await this.isMixerService(address!)) {
          externalChecks.mixerService = true;
          flags.push({
            type: 'mixer_service',
            severity: 'high',
            description: `Address ${address} belongs to mixing service`,
            evidence: { address }
          });
        }
      }

    } catch (error) {
      console.error('External checks failed:', error);
    }

    return { externalChecks, flags };
  }

  /**
   * Check if address is associated with known scams
   */
  private async isKnownScamAddress(address: string): Promise<boolean> {
    // This would integrate with external scam databases
    // Placeholder implementation
    const knownScamPatterns = [
      /^0x000000000000000000000000/i,
      /^0xdeadbeef/i,
      /^0x1234567890/i
    ];
    
    return knownScamPatterns.some(pattern => pattern.test(address));
  }

  /**
   * Check if address belongs to a mixer service
   */
  private async isMixerService(address: string): Promise<boolean> {
    // This would check against known mixer addresses
    // Placeholder implementation
    const mixerKeywords = ['tornado', 'mixer', 'tumbler'];
    return mixerKeywords.some(keyword => address.toLowerCase().includes(keyword));
  }

  /**
   * Analyze transaction velocity
   */
  private async analyzeVelocity(userId: string, amount: number): Promise<{
    velocityCheck: boolean;
    flags: Array<{ type: string; severity: string; description: string; evidence: any }>;
  }> {
    const flags: Array<{ type: string; severity: string; description: string; evidence: any }> = [];
    let velocityCheck = false;

    // Get user's recent transactions
    let userVelocity = this.velocityTracker.get(userId) || [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Filter to recent transactions
    userVelocity = userVelocity.filter(tx => tx.timestamp > oneHourAgo);

    // Add current transaction
    userVelocity.push({ amount, timestamp: now });
    this.velocityTracker.set(userId, userVelocity);

    // Check velocity limits
    const totalAmount = userVelocity.reduce((sum, tx) => sum + tx.amount, 0);
    const transactionCount = userVelocity.length;

    if (totalAmount > this.config.thresholds.velocityLimit) {
      velocityCheck = true;
      flags.push({
        type: 'velocity_limit_exceeded',
        severity: 'high',
        description: `User exceeded velocity limit: $${totalAmount} in 1 hour`,
        evidence: { 
          totalAmount,
          limit: this.config.thresholds.velocityLimit,
          transactionCount 
        }
      });
    }

    if (transactionCount > this.config.thresholds.rapidTransactionCount) {
      velocityCheck = true;
      flags.push({
        type: 'rapid_transactions',
        severity: 'medium',
        description: `${transactionCount} transactions in 1 hour`,
        evidence: { transactionCount, timeWindow: '1 hour' }
      });
    }

    return { velocityCheck, flags };
  }

  /**
   * Detect various anomalies in the transaction
   */
  private async detectAnomalies(
    transaction: TransactionData,
    userProfile: UserRiskProfile
  ): Promise<{
    flags: Array<{ type: string; severity: string; description: string; evidence: any }>;
  }> {
    const flags: Array<{ type: string; severity: string; description: string; evidence: any }> = [];

    // Large round number anomaly
    if (transaction.amount % 1000 === 0 && transaction.amount >= 10000) {
      flags.push({
        type: 'round_number_anomaly',
        severity: 'low',
        description: `Suspiciously round amount: ${transaction.amount}`,
        evidence: { amount: transaction.amount }
      });
    }

    // Weekend high-value transaction
    const isWeekend = transaction.timestamp.getDay() === 0 || transaction.timestamp.getDay() === 6;
    if (isWeekend && transaction.amount > 50000) {
      flags.push({
        type: 'weekend_high_value',
        severity: 'medium',
        description: 'High-value transaction during weekend',
        evidence: { amount: transaction.amount, day: transaction.timestamp.getDay() }
      });
    }

    // Cross-border indication (simplified)
    if (transaction.metadata.notes && /international|overseas|foreign/.test(transaction.metadata.notes.toLowerCase())) {
      flags.push({
        type: 'international_transaction',
        severity: 'medium',
        description: 'Transaction indicates international transfer',
        evidence: { notes: transaction.metadata.notes }
      });
    }

    return { flags };
  }

  /**
   * Combine all analysis results
   */
  private combineAnalysisResults(
    analysis: FraudAnalysisResult,
    analyses: PromiseSettledResult<any>[]
  ): void {
    let totalRisk = 0;
    const allFlags: Array<{ type: string; severity: string; description: string; evidence: any }> = [];

    // Process user risk analysis
    if (analyses[0].status === 'fulfilled') {
      totalRisk += analyses[0].value.riskScore * 0.3;
      allFlags.push(...analyses[0].value.flags);
    }

    // Process address analysis
    if (analyses[1].status === 'fulfilled') {
      analysis.addressAnalysis = analyses[1].value.addressAnalysis;
      allFlags.push(...analyses[1].value.flags);
      
      // Calculate address risk contribution
      const fromRisk = analyses[1].value.addressAnalysis.fromAddress?.riskScore || 0;
      const toRisk = analyses[1].value.addressAnalysis.toAddress?.riskScore || 0;
      totalRisk += Math.max(fromRisk, toRisk) * 0.25;
    }

    // Process pattern analysis
    if (analyses[2].status === 'fulfilled') {
      analysis.patternAnalysis = analyses[2].value.patternAnalysis;
      allFlags.push(...analyses[2].value.flags);
      
      // Calculate pattern risk
      const patternRisk = Object.values(analyses[2].value.patternAnalysis).filter(Boolean).length / 4;
      totalRisk += patternRisk * 0.2;
    }

    // Process external checks
    if (analyses[3].status === 'fulfilled') {
      analysis.externalChecks = analyses[3].value.externalChecks;
      allFlags.push(...analyses[3].value.flags);
      
      // Critical external risks
      if (analyses[3].value.externalChecks.blacklistHit || analyses[3].value.externalChecks.knownScam) {
        totalRisk += 0.8;
      }
      if (analyses[3].value.externalChecks.mixerService) {
        totalRisk += 0.4;
      }
    }

    // Process velocity analysis
    if (analyses[4].status === 'fulfilled') {
      analysis.patternAnalysis.velocityCheck = analyses[4].value.velocityCheck;
      allFlags.push(...analyses[4].value.flags);
      
      if (analyses[4].value.velocityCheck) {
        totalRisk += 0.3;
      }
    }

    // Process anomaly detection
    if (analyses[5].status === 'fulfilled') {
      allFlags.push(...analyses[5].value.flags);
      totalRisk += analyses[5].value.flags.length * 0.05; // Small contribution per anomaly
    }

    analysis.riskScore = Math.min(totalRisk, 1);
    analysis.flags = allFlags;
  }

  /**
   * Calculate final risk score
   */
  private calculateFinalRiskScore(analysis: FraudAnalysisResult): number {
    // Risk score is already calculated in combineAnalysisResults
    return analysis.riskScore;
  }

  /**
   * Calculate risk level from score
   */
  private calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 0.8) return 'critical';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Calculate analysis confidence
   */
  private calculateConfidence(analysis: FraudAnalysisResult): number {
    let confidence = 0.5; // Base confidence
    
    // More flags = higher confidence in assessment
    confidence += Math.min(analysis.flags.length * 0.1, 0.3);
    
    // External verification increases confidence
    if (analysis.externalChecks.blacklistHit || analysis.externalChecks.knownScam) {
      confidence += 0.4;
    }
    
    // Pattern analysis increases confidence
    const patternCount = Object.values(analysis.patternAnalysis).filter(Boolean).length;
    confidence += patternCount * 0.05;
    
    return Math.min(confidence, 1);
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(analysis: FraudAnalysisResult): Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }> {
    const recommendations: Array<{
      action: string;
      priority: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    if (analysis.riskLevel === 'critical') {
      recommendations.push({
        action: 'block_transaction',
        priority: 'high',
        description: 'Block transaction immediately due to critical risk factors'
      });
      recommendations.push({
        action: 'freeze_account',
        priority: 'high',
        description: 'Temporarily freeze user account pending investigation'
      });
    } else if (analysis.riskLevel === 'high') {
      recommendations.push({
        action: 'manual_review',
        priority: 'high',
        description: 'Require manual approval before processing transaction'
      });
      recommendations.push({
        action: 'enhanced_verification',
        priority: 'medium',
        description: 'Require additional identity verification'
      });
    } else if (analysis.riskLevel === 'medium') {
      recommendations.push({
        action: 'additional_checks',
        priority: 'medium',
        description: 'Perform additional verification checks'
      });
      recommendations.push({
        action: 'monitor_closely',
        priority: 'low',
        description: 'Monitor user activity more closely'
      });
    }

    // Specific recommendations based on flags
    const hasVelocityIssue = analysis.flags.some(f => f.type.includes('velocity'));
    if (hasVelocityIssue) {
      recommendations.push({
        action: 'impose_velocity_limits',
        priority: 'medium',
        description: 'Impose stricter velocity limits for this user'
      });
    }

    const hasAddressIssue = analysis.flags.some(f => f.type.includes('address'));
    if (hasAddressIssue) {
      recommendations.push({
        action: 'blacklist_address',
        priority: 'high',
        description: 'Consider adding risky addresses to blacklist'
      });
    }

    return recommendations;
  }

  /**
   * Determine if transaction should be blocked
   */
  private shouldBlockTransaction(analysis: FraudAnalysisResult): boolean {
    // Block if critical risk or specific high-risk conditions
    if (analysis.riskLevel === 'critical') return true;
    
    // Block if blacklisted address
    if (analysis.externalChecks.blacklistHit) return true;
    
    // Block if known scam
    if (analysis.externalChecks.knownScam) return true;
    
    // Block if high risk with high confidence
    if (analysis.riskLevel === 'high' && analysis.confidence > 0.8) return true;
    
    return false;
  }

  /**
   * Update user risk profile
   */
  private async updateUserProfile(
    userId: string,
    transaction: TransactionData,
    analysis: FraudAnalysisResult
  ): Promise<void> {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = await this.createUserProfile(userId);
    }

    // Update transaction history count
    profile.factors.transactionHistory++;

    // Update average amount
    profile.factors.averageAmount = 
      (profile.factors.averageAmount * (profile.factors.transactionHistory - 1) + transaction.amount) / 
      profile.factors.transactionHistory;

    // Update suspicious count if high risk
    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      profile.factors.suspiciousCount++;
    }

    // Update behavior patterns
    const hour = transaction.timestamp.getHours();
    if (!profile.patterns.preferredTimes.includes(hour)) {
      profile.patterns.preferredTimes.push(hour);
    }

    if (transaction.amount > 0 && !profile.patterns.commonAmounts.includes(transaction.amount)) {
      profile.patterns.commonAmounts.push(transaction.amount);
      // Keep only top 10 amounts
      profile.patterns.commonAmounts = profile.patterns.commonAmounts.slice(-10);
    }

    if (transaction.toAddress && !profile.patterns.frequentAddresses.includes(transaction.toAddress)) {
      profile.patterns.frequentAddresses.push(transaction.toAddress);
      // Keep only top 20 addresses
      profile.patterns.frequentAddresses = profile.patterns.frequentAddresses.slice(-20);
    }

    // Update risk score based on recent activity
    profile.riskScore = this.calculateUserRiskScore(profile, analysis);
    profile.riskLevel = this.calculateRiskLevel(profile.riskScore);
    profile.lastUpdate = new Date();

    // Store transaction in history
    let userTransactions = this.transactionHistory.get(userId) || [];
    userTransactions.push(transaction);
    // Keep only last 100 transactions
    if (userTransactions.length > 100) {
      userTransactions = userTransactions.slice(-100);
    }
    this.transactionHistory.set(userId, userTransactions);

    this.userProfiles.set(userId, profile);
  }

  /**
   * Calculate user risk score based on profile and recent analysis
   */
  private calculateUserRiskScore(profile: UserRiskProfile, analysis: FraudAnalysisResult): number {
    let score = 0;

    // Account age factor
    score += Math.max(0, (30 - profile.factors.accountAge) / 30) * 0.2;

    // Verification level factor
    const verificationScores = { none: 0.3, basic: 0.2, enhanced: 0.1, premium: 0 };
    score += verificationScores[profile.factors.verificationLevel];

    // Suspicious activity factor
    score += Math.min(profile.factors.suspiciousCount * 0.1, 0.3);

    // Recent analysis impact
    score += analysis.riskScore * 0.2;

    // Reputation factor (inverse)
    score += (1 - profile.factors.reputationScore) * 0.1;

    return Math.min(score, 1);
  }

  /**
   * Create new user risk profile
   */
  private async createUserProfile(userId: string): Promise<UserRiskProfile> {
    // In production, load from database
    const profile: UserRiskProfile = {
      userId,
      riskScore: 0.3, // Default moderate risk for new users
      riskLevel: 'medium',
      factors: {
        accountAge: 0, // Would calculate from user creation date
        verificationLevel: 'none',
        transactionHistory: 0,
        averageAmount: 0,
        suspiciousCount: 0,
        flaggedAddresses: 0,
        socialScore: 0.5,
        reputationScore: 0.5
      },
      patterns: {
        preferredTimes: [],
        commonAmounts: [],
        frequentAddresses: [],
        behaviorAnomalies: []
      },
      lastUpdate: new Date()
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  private async getUserRiskProfile(userId: string): Promise<UserRiskProfile> {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = await this.createUserProfile(userId);
    }
    return profile;
  }

  /**
   * Execute security actions based on analysis
   */
  private async executeSecurityActions(
    transaction: TransactionData,
    analysis: FraudAnalysisResult
  ): Promise<void> {
    try {
      if (analysis.blocked) {
        // Block transaction
        await this.queue.add('block-transaction', {
          transactionId: transaction.id,
          userId: transaction.userId,
          reason: `Fraud detection: ${analysis.riskLevel} risk`,
          flags: analysis.flags.map(f => f.type),
          riskScore: analysis.riskScore
        });
      }

      if (this.config.actions.notifyModerators && analysis.riskLevel === 'critical') {
        // Notify moderators
        await this.queue.add('notify-fraud-team', {
          transactionId: transaction.id,
          userId: transaction.userId,
          riskLevel: analysis.riskLevel,
          riskScore: analysis.riskScore,
          flags: analysis.flags,
          serverId: transaction.metadata.serverId
        });
      }

      if (this.config.actions.autoFreeze && analysis.riskLevel === 'critical') {
        // Freeze user account
        await this.queue.add('freeze-user-account', {
          userId: transaction.userId,
          reason: 'Critical fraud risk detected',
          duration: 24 * 60 * 60, // 24 hours
          requiresManualReview: true
        });
      }

    } catch (error) {
      console.error('Failed to execute security actions:', error);
    }
  }

  /**
   * Logging and audit
   */
  private async logFraudAnalysis(
    transaction: TransactionData,
    analysis: FraudAnalysisResult
  ): Promise<void> {
    try {
      if (transaction.metadata.serverId && analysis.riskLevel !== 'low') {
        await prisma.auditLog.create({
          data: {
            serverId: transaction.metadata.serverId,
            userId: 'system',
            targetId: transaction.userId,
            actionType: 992, // Fraud detection action type
            reason: `Fraud analysis: ${analysis.riskLevel} risk`,
            options: {
              transactionId: transaction.id,
              riskScore: analysis.riskScore,
              riskLevel: analysis.riskLevel,
              confidence: analysis.confidence,
              flagCount: analysis.flags.length,
              topFlags: analysis.flags.slice(0, 3).map(f => f.type),
              blocked: analysis.blocked,
              processingTime: analysis.processingTime,
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      // Store suspicious transaction for investigation
      if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
        this.suspiciousTransactions.set(transaction.id, analysis);
      }

      console.log(`🚨 Fraud analysis: ${transaction.id} - ${analysis.riskLevel} risk (${(analysis.riskScore * 100).toFixed(1)}%) - ${analysis.blocked ? 'BLOCKED' : 'ALLOWED'}`);
    } catch (error) {
      console.error('Failed to log fraud analysis:', error);
    }
  }

  private createSafeAnalysisResult(transactionId: string, startTime: number): FraudAnalysisResult {
    return {
      transactionId,
      riskScore: 0.5, // Default to medium risk on error
      riskLevel: 'medium',
      confidence: 0.3,
      flags: [{ type: 'analysis_error', severity: 'medium', description: 'Fraud analysis failed', evidence: {} }],
      recommendations: [{ action: 'manual_review', priority: 'medium', description: 'Review transaction manually due to analysis failure' }],
      addressAnalysis: {},
      patternAnalysis: {
        velocityCheck: false,
        amountAnomaly: false,
        timeAnomaly: false,
        behaviorAnomaly: false
      },
      externalChecks: {
        blacklistHit: false,
        sanctionsList: false,
        knownScam: false,
        mixerService: false
      },
      processingTime: Date.now() - startTime,
      blocked: false
    };
  }

  /**
   * Initialize fraud patterns
   */
  private initializeFraudPatterns(): void {
    const patterns: FraudPattern[] = [
      {
        id: 'velocity_abuse',
        name: 'Velocity Abuse',
        description: 'Multiple high-value transactions in short timeframe',
        type: 'velocity',
        conditions: [
          { field: 'transaction_count_1h', operator: 'greater_than', value: 5, weight: 0.3 },
          { field: 'total_amount_1h', operator: 'greater_than', value: 10000, weight: 0.5 }
        ],
        riskScore: 0.7,
        enabled: true,
        triggerCount: 0
      },
      {
        id: 'round_amount_pattern',
        name: 'Round Amount Pattern',
        description: 'Suspicious round number transactions',
        type: 'amount',
        conditions: [
          { field: 'amount', operator: 'modulo_zero', value: 1000, weight: 0.2 },
          { field: 'amount', operator: 'greater_than', value: 5000, weight: 0.3 }
        ],
        riskScore: 0.4,
        enabled: true,
        triggerCount: 0
      }
    ];

    for (const pattern of patterns) {
      this.fraudPatterns.set(pattern.id, pattern);
    }
  }

  /**
   * Load blacklists from external sources
   */
  private loadBlacklists(): void {
    // In production, load from databases and external APIs
    const sampleBlacklistedAddresses = [
      '0x0000000000000000000000000000000000000000',
      '0x000000000000000000000000000000000000dead',
    ];

    sampleBlacklistedAddresses.forEach(addr => this.blacklistedAddresses.add(addr));

    console.log(`📋 Loaded ${this.blacklistedAddresses.size} blacklisted addresses`);
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    // Clean up velocity tracker periodically
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      for (const [userId, transactions] of this.velocityTracker.entries()) {
        const recentTransactions = transactions.filter(tx => tx.timestamp > oneHourAgo);
        
        if (recentTransactions.length === 0) {
          this.velocityTracker.delete(userId);
        } else {
          this.velocityTracker.set(userId, recentTransactions);
        }
      }
    }, 15 * 60 * 1000); // Every 15 minutes

    // Clean up address cache
    setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      for (const [address, cached] of this.addressCache.entries()) {
        if (cached.timestamp < oneHourAgo) {
          this.addressCache.delete(address);
        }
      }
    }, 60 * 60 * 1000); // Every hour

    console.log('🔍 Real-time fraud monitoring started');
  }

  /**
   * Configuration management
   */
  private getDefaultConfig(): FraudDetectionConfig {
    return {
      thresholds: {
        highRiskScore: 0.7,
        suspiciousAmount: 10000,
        rapidTransactionCount: 5,
        newAccountDays: 7,
        velocityLimit: 50000
      },
      monitoring: {
        enableRealTime: true,
        checkBlacklists: true,
        analyzePatterns: true,
        trackVelocity: true,
        verifyAddresses: true
      },
      blockchains: {
        ethereum: {
          enabled: true,
          rpcUrl: process.env.ETHEREUM_RPC_URL || '',
          explorerApi: process.env.ETHERSCAN_API_URL || 'https://api.etherscan.io'
        },
        bitcoin: {
          enabled: false,
          rpcUrl: process.env.BITCOIN_RPC_URL || '',
          explorerApi: process.env.BITCOIN_API_URL || ''
        },
        polygon: {
          enabled: true,
          rpcUrl: process.env.POLYGON_RPC_URL || '',
          explorerApi: process.env.POLYGONSCAN_API_URL || 'https://api.polygonscan.com'
        }
      },
      actions: {
        autoFreeze: true,
        requireVerification: true,
        notifyModerators: true,
        escalateToManual: true
      }
    };
  }

  updateConfig(newConfig: Partial<FraudDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalAnalyses: number;
    blockedTransactions: number;
    riskDistribution: { [level: string]: number };
    userProfiles: number;
    blacklistedAddresses: number;
    averageProcessingTime: number;
  } {
    const suspiciousArray = Array.from(this.suspiciousTransactions.values());
    const riskDistribution = {
      low: suspiciousArray.filter(a => a.riskLevel === 'low').length,
      medium: suspiciousArray.filter(a => a.riskLevel === 'medium').length,
      high: suspiciousArray.filter(a => a.riskLevel === 'high').length,
      critical: suspiciousArray.filter(a => a.riskLevel === 'critical').length
    };

    const avgProcessingTime = suspiciousArray.length > 0 
      ? suspiciousArray.reduce((sum, a) => sum + a.processingTime, 0) / suspiciousArray.length
      : 0;

    return {
      totalAnalyses: suspiciousArray.length,
      blockedTransactions: suspiciousArray.filter(a => a.blocked).length,
      riskDistribution,
      userProfiles: this.userProfiles.size,
      blacklistedAddresses: this.blacklistedAddresses.size,
      averageProcessingTime: avgProcessingTime
    };
  }
}