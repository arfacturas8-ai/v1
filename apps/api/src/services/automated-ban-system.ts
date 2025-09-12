import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import { ToxicityDetectionService } from './toxicity-detection';
import { SpamDetectionService } from './spam-detection';
import { AutoModerationEngine } from './auto-moderation-engine';

export interface BanSystemConfig {
  escalation: {
    enableAutoEscalation: boolean;
    escalationThresholds: {
      warningCount: number;
      timeoutCount: number;
      tempBanCount: number;
    };
    escalationWindows: {
      warnings: number; // hours
      timeouts: number; // hours
      bans: number; // hours
    };
  };
  punishments: {
    warning: {
      enabled: boolean;
      maxPerDay: number;
      duration: number; // Not applicable for warnings
    };
    timeout: {
      enabled: boolean;
      durations: number[]; // escalating durations in seconds
      maxPerDay: number;
    };
    tempBan: {
      enabled: boolean;
      durations: number[]; // escalating durations in seconds
      maxPerWeek: number;
    };
    permaBan: {
      enabled: boolean;
      requiresApproval: boolean;
      minimumViolations: number;
    };
  };
  appeals: {
    enableAppeals: boolean;
    cooldownPeriod: number; // hours between appeals
    maxAppealsPerPunishment: number;
    autoReviewThreshold: number; // days
  };
  monitoring: {
    trackPatterns: boolean;
    detectEvaders: boolean;
    crossServerTracking: boolean;
    ipTracking: boolean;
  };
}

export interface UserViolationRecord {
  userId: string;
  serverId?: string; // null for global violations
  violations: Array<{
    id: string;
    type: 'toxicity' | 'spam' | 'nsfw' | 'harassment' | 'fraud' | 'custom';
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    evidence: any;
    messageId?: string;
    channelId?: string;
    automated: boolean;
    resolved: boolean;
  }>;
  punishments: Array<{
    id: string;
    type: 'warning' | 'timeout' | 'temp_ban' | 'perm_ban';
    duration?: number;
    reason: string;
    timestamp: Date;
    expiresAt?: Date;
    appealable: boolean;
    appealed: boolean;
    appealResolved?: boolean;
    issuedBy: string; // 'system' or moderator ID
    violationIds: string[];
  }>;
  escalationLevel: number;
  lastViolation: Date;
  totalViolations: number;
  riskScore: number;
  status: 'clean' | 'warning' | 'timeout' | 'temp_ban' | 'perm_ban';
  metadata: {
    ipAddresses: string[];
    userAgents: string[];
    firstViolation?: Date;
    pattern: string[];
    evasionAttempts: number;
  };
}

export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    timeWindow?: number; // hours
  }>;
  action: {
    type: 'warning' | 'timeout' | 'temp_ban' | 'perm_ban' | 'manual_review';
    duration?: number;
    reason: string;
    requiresApproval?: boolean;
  };
  priority: number;
  enabled: boolean;
}

export interface AppealRequest {
  id: string;
  userId: string;
  serverId?: string;
  punishmentId: string;
  reason: string;
  evidence?: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'denied' | 'auto_resolved';
  reviewedBy?: string;
  reviewedAt?: Date;
  decision?: string;
  escalated: boolean;
}

export interface BanEvasionDetection {
  suspectedUserId: string;
  originalUserId: string;
  confidence: number;
  evidence: Array<{
    type: 'ip_match' | 'user_agent_match' | 'behavior_pattern' | 'timing_pattern' | 'device_fingerprint';
    score: number;
    details: any;
  }>;
  timestamp: Date;
  actionTaken: boolean;
}

export class AutomatedBanSystem {
  private queue: Queue;
  private config: BanSystemConfig;
  
  // Service dependencies
  private toxicityService: ToxicityDetectionService;
  private spamService: SpamDetectionService;
  private moderationEngine: AutoModerationEngine;
  
  // Data structures
  private userViolations: Map<string, UserViolationRecord> = new Map(); // userId -> record
  private serverViolations: Map<string, Map<string, UserViolationRecord>> = new Map(); // serverId -> userId -> record
  private escalationRules: Map<string, EscalationRule> = new Map();
  private activeAppeals: Map<string, AppealRequest> = new Map();
  private banEvasionTracker: Map<string, Array<{ userId: string; timestamp: Date; metadata: any }>> = new Map(); // IP -> users
  
  // Caching and tracking
  private userSessions: Map<string, { lastSeen: Date; ipAddress: string; userAgent: string }> = new Map();
  private punishmentCache: Map<string, { userId: string; type: string; expiresAt?: Date }> = new Map();

  constructor(
    moderationQueue: Queue,
    toxicityService: ToxicityDetectionService,
    spamService: SpamDetectionService,
    moderationEngine: AutoModerationEngine
  ) {
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    this.toxicityService = toxicityService;
    this.spamService = spamService;
    this.moderationEngine = moderationEngine;
    
    this.initializeEscalationRules();
    this.startMonitoring();
  }

  /**
   * Process a violation and determine appropriate punishment
   */
  async processViolation(
    userId: string,
    violationType: 'toxicity' | 'spam' | 'nsfw' | 'harassment' | 'fraud' | 'custom',
    severity: 'low' | 'medium' | 'high' | 'critical',
    evidence: any,
    serverId?: string,
    messageId?: string,
    channelId?: string
  ): Promise<{
    punishmentIssued: boolean;
    punishment?: any;
    escalated: boolean;
    requiresApproval: boolean;
  }> {
    try {
      // Get or create user violation record
      const userRecord = await this.getUserViolationRecord(userId, serverId);
      
      // Add the new violation
      const violationId = this.generateViolationId();
      const violation = {
        id: violationId,
        type: violationType,
        severity,
        timestamp: new Date(),
        evidence,
        messageId,
        channelId,
        automated: true,
        resolved: false
      };
      
      userRecord.violations.push(violation);
      userRecord.totalViolations++;
      userRecord.lastViolation = new Date();
      
      // Update risk score
      userRecord.riskScore = this.calculateRiskScore(userRecord);
      
      // Determine appropriate punishment using escalation rules
      const escalationResult = await this.evaluateEscalation(userRecord, violation);
      
      if (escalationResult.punishment) {
        // Issue the punishment
        const punishmentResult = await this.issuePunishment(
          userId,
          escalationResult.punishment,
          [violationId],
          serverId
        );
        
        // Log the enforcement action
        await this.logEnforcementAction(userId, violation, escalationResult.punishment, serverId);
        
        return {
          punishmentIssued: true,
          punishment: escalationResult.punishment,
          escalated: escalationResult.escalated,
          requiresApproval: escalationResult.requiresApproval
        };
      }
      
      // Update records
      this.updateUserRecord(userId, userRecord, serverId);
      
      return {
        punishmentIssued: false,
        escalated: false,
        requiresApproval: false
      };
    } catch (error) {
      console.error('Violation processing failed:', error);
      return {
        punishmentIssued: false,
        escalated: false,
        requiresApproval: false
      };
    }
  }

  /**
   * Evaluate escalation rules to determine punishment
   */
  private async evaluateEscalation(
    userRecord: UserViolationRecord,
    currentViolation: any
  ): Promise<{
    punishment?: any;
    escalated: boolean;
    requiresApproval: boolean;
  }> {
    // Sort escalation rules by priority
    const sortedRules = Array.from(this.escalationRules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules) {
      if (await this.ruleMatches(rule, userRecord, currentViolation)) {
        const punishment = {
          type: rule.action.type,
          duration: rule.action.duration,
          reason: rule.action.reason,
          issuedBy: 'system',
          timestamp: new Date(),
          appealable: rule.action.type !== 'warning'
        };
        
        return {
          punishment,
          escalated: rule.action.type !== 'warning',
          requiresApproval: rule.action.requiresApproval || false
        };
      }
    }
    
    // Default escalation based on violation count and severity
    return this.defaultEscalation(userRecord, currentViolation);
  }

  /**
   * Check if escalation rule conditions are met
   */
  private async ruleMatches(
    rule: EscalationRule,
    userRecord: UserViolationRecord,
    currentViolation: any
  ): Promise<boolean> {
    for (const condition of rule.conditions) {
      if (!await this.evaluateCondition(condition, userRecord, currentViolation)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a single escalation condition
   */
  private async evaluateCondition(
    condition: any,
    userRecord: UserViolationRecord,
    currentViolation: any
  ): Promise<boolean> {
    const { field, operator, value, timeWindow } = condition;
    
    let fieldValue: any;
    
    switch (field) {
      case 'violation_count':
        if (timeWindow) {
          const since = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
          fieldValue = userRecord.violations.filter(v => v.timestamp >= since).length;
        } else {
          fieldValue = userRecord.totalViolations;
        }
        break;
        
      case 'severity':
        fieldValue = currentViolation.severity;
        break;
        
      case 'violation_type':
        fieldValue = currentViolation.type;
        break;
        
      case 'risk_score':
        fieldValue = userRecord.riskScore;
        break;
        
      case 'escalation_level':
        fieldValue = userRecord.escalationLevel;
        break;
        
      case 'recent_punishments':
        if (timeWindow) {
          const since = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
          fieldValue = userRecord.punishments.filter(p => p.timestamp >= since).length;
        } else {
          fieldValue = userRecord.punishments.length;
        }
        break;
        
      case 'punishment_type_count':
        if (timeWindow) {
          const since = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
          fieldValue = userRecord.punishments.filter(p => 
            p.type === value.type && p.timestamp >= since
          ).length;
        } else {
          fieldValue = userRecord.punishments.filter(p => p.type === value.type).length;
        }
        break;
        
      default:
        return false;
    }
    
    // Evaluate the condition
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'greater_than':
        return fieldValue > value;
      case 'greater_equal':
        return fieldValue >= value;
      case 'less_than':
        return fieldValue < value;
      case 'less_equal':
        return fieldValue <= value;
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(value);
      default:
        return false;
    }
  }

  /**
   * Default escalation when no rules match
   */
  private defaultEscalation(
    userRecord: UserViolationRecord,
    currentViolation: any
  ): {
    punishment?: any;
    escalated: boolean;
    requiresApproval: boolean;
  } {
    const recentViolations = userRecord.violations.filter(v => 
      Date.now() - v.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    // Critical violations get immediate escalation
    if (currentViolation.severity === 'critical') {
      if (userRecord.totalViolations >= 3) {
        return {
          punishment: {
            type: 'temp_ban',
            duration: 7 * 24 * 60 * 60, // 7 days
            reason: 'Critical violation with history of violations',
            issuedBy: 'system',
            timestamp: new Date(),
            appealable: true
          },
          escalated: true,
          requiresApproval: false
        };
      } else {
        return {
          punishment: {
            type: 'timeout',
            duration: 24 * 60 * 60, // 24 hours
            reason: 'Critical violation',
            issuedBy: 'system',
            timestamp: new Date(),
            appealable: true
          },
          escalated: true,
          requiresApproval: false
        };
      }
    }
    
    // Progressive escalation based on recent violations
    if (recentViolations.length >= 5) {
      return {
        punishment: {
          type: 'temp_ban',
          duration: 3 * 24 * 60 * 60, // 3 days
          reason: 'Multiple violations in 24 hours',
          issuedBy: 'system',
          timestamp: new Date(),
          appealable: true
        },
        escalated: true,
        requiresApproval: false
      };
    } else if (recentViolations.length >= 3) {
      return {
        punishment: {
          type: 'timeout',
          duration: 4 * 60 * 60, // 4 hours
          reason: 'Repeated violations',
          issuedBy: 'system',
          timestamp: new Date(),
          appealable: true
        },
        escalated: true,
        requiresApproval: false
      };
    } else if (recentViolations.length >= 2) {
      return {
        punishment: {
          type: 'warning',
          reason: 'Pattern of violations detected',
          issuedBy: 'system',
          timestamp: new Date(),
          appealable: false
        },
        escalated: false,
        requiresApproval: false
      };
    }
    
    // No escalation needed
    return {
      escalated: false,
      requiresApproval: false
    };
  }

  /**
   * Issue a punishment to a user
   */
  private async issuePunishment(
    userId: string,
    punishment: any,
    violationIds: string[],
    serverId?: string
  ): Promise<{ success: boolean; punishmentId: string }> {
    try {
      const punishmentId = this.generatePunishmentId();
      
      // Add to user record
      const userRecord = await this.getUserViolationRecord(userId, serverId);
      const fullPunishment = {
        ...punishment,
        id: punishmentId,
        violationIds,
        appealed: false,
        expiresAt: punishment.duration ? 
          new Date(Date.now() + punishment.duration * 1000) : undefined
      };
      
      userRecord.punishments.push(fullPunishment);
      userRecord.status = punishment.type === 'perm_ban' ? 'perm_ban' :
                         punishment.type === 'temp_ban' ? 'temp_ban' :
                         punishment.type === 'timeout' ? 'timeout' : 'warning';
      
      // Update escalation level
      if (punishment.type !== 'warning') {
        userRecord.escalationLevel++;
      }
      
      // Queue the actual enforcement action
      await this.queueEnforcementAction(userId, punishment, serverId);
      
      // Cache active punishment
      if (punishment.duration) {
        this.punishmentCache.set(punishmentId, {
          userId,
          type: punishment.type,
          expiresAt: fullPunishment.expiresAt
        });
      }
      
      // Update records
      this.updateUserRecord(userId, userRecord, serverId);
      
      console.log(`⚖️ Punishment issued: ${userId} - ${punishment.type} (${punishment.reason})`);
      
      return { success: true, punishmentId };
    } catch (error) {
      console.error('Failed to issue punishment:', error);
      return { success: false, punishmentId: '' };
    }
  }

  /**
   * Queue enforcement action for execution
   */
  private async queueEnforcementAction(
    userId: string,
    punishment: any,
    serverId?: string
  ): Promise<void> {
    const actionType = `${punishment.type.replace('_', '-')}-user`;
    
    const actionData = {
      userId,
      reason: punishment.reason,
      serverId,
      duration: punishment.duration,
      issuedBy: punishment.issuedBy,
      automated: true,
      timestamp: punishment.timestamp
    };
    
    await this.queue.add(actionType, actionData);
    
    // Send notification if needed
    if (punishment.type !== 'warning') {
      await this.queue.add('notify-user-punishment', {
        userId,
        punishment: punishment.type,
        reason: punishment.reason,
        duration: punishment.duration,
        appealable: punishment.appealable,
        serverId
      });
    }
  }

  /**
   * Process an appeal request
   */
  async processAppeal(
    userId: string,
    punishmentId: string,
    reason: string,
    evidence?: string,
    serverId?: string
  ): Promise<{
    success: boolean;
    appealId?: string;
    message: string;
  }> {
    try {
      // Validate appeal eligibility
      const eligibilityCheck = await this.checkAppealEligibility(userId, punishmentId, serverId);
      if (!eligibilityCheck.eligible) {
        return {
          success: false,
          message: eligibilityCheck.reason
        };
      }
      
      // Create appeal request
      const appealId = this.generateAppealId();
      const appeal: AppealRequest = {
        id: appealId,
        userId,
        serverId,
        punishmentId,
        reason,
        evidence,
        timestamp: new Date(),
        status: 'pending',
        escalated: false
      };
      
      this.activeAppeals.set(appealId, appeal);
      
      // Mark punishment as appealed
      const userRecord = await this.getUserViolationRecord(userId, serverId);
      const punishment = userRecord.punishments.find(p => p.id === punishmentId);
      if (punishment) {
        punishment.appealed = true;
      }
      
      // Queue for moderator review
      await this.queue.add('review-appeal', {
        appealId,
        userId,
        punishmentId,
        reason,
        evidence,
        serverId,
        priority: this.calculateAppealPriority(appeal, userRecord)
      });
      
      // Log appeal
      await this.logAppeal(appeal);
      
      console.log(`📝 Appeal submitted: ${appealId} for punishment ${punishmentId}`);
      
      return {
        success: true,
        appealId,
        message: 'Appeal submitted successfully and is under review'
      };
    } catch (error) {
      console.error('Appeal processing failed:', error);
      return {
        success: false,
        message: 'Failed to submit appeal'
      };
    }
  }

  /**
   * Check if user is eligible to appeal
   */
  private async checkAppealEligibility(
    userId: string,
    punishmentId: string,
    serverId?: string
  ): Promise<{ eligible: boolean; reason: string }> {
    const userRecord = await this.getUserViolationRecord(userId, serverId);
    const punishment = userRecord.punishments.find(p => p.id === punishmentId);
    
    if (!punishment) {
      return { eligible: false, reason: 'Punishment not found' };
    }
    
    if (!punishment.appealable) {
      return { eligible: false, reason: 'This punishment is not appealable' };
    }
    
    if (punishment.appealed && punishment.appealResolved) {
      return { eligible: false, reason: 'This punishment has already been appealed' };
    }
    
    // Check cooldown period
    const existingAppeals = Array.from(this.activeAppeals.values()).filter(a => 
      a.userId === userId && a.punishmentId === punishmentId
    );
    
    if (existingAppeals.length >= this.config.appeals.maxAppealsPerPunishment) {
      return { eligible: false, reason: 'Maximum appeals reached for this punishment' };
    }
    
    const lastAppeal = existingAppeals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    if (lastAppeal) {
      const cooldownExpires = new Date(lastAppeal.timestamp.getTime() + 
                                      this.config.appeals.cooldownPeriod * 60 * 60 * 1000);
      if (Date.now() < cooldownExpires.getTime()) {
        return { 
          eligible: false, 
          reason: `Appeal cooldown active until ${cooldownExpires.toISOString()}` 
        };
      }
    }
    
    return { eligible: true, reason: 'Eligible for appeal' };
  }

  /**
   * Calculate appeal priority for moderator queue
   */
  private calculateAppealPriority(appeal: AppealRequest, userRecord: UserViolationRecord): 'low' | 'medium' | 'high' {
    // Higher priority for users with fewer violations
    if (userRecord.totalViolations <= 3) return 'high';
    if (userRecord.totalViolations <= 10) return 'medium';
    return 'low';
  }

  /**
   * Detect potential ban evasion
   */
  async detectBanEvasion(
    userId: string,
    ipAddress: string,
    userAgent: string,
    serverId?: string
  ): Promise<BanEvasionDetection | null> {
    try {
      const evidence: Array<{
        type: 'ip_match' | 'user_agent_match' | 'behavior_pattern' | 'timing_pattern' | 'device_fingerprint';
        score: number;
        details: any;
      }> = [];
      
      let totalConfidence = 0;
      let suspectedOriginalUserId: string | null = null;
      
      // Check IP address matches
      const ipHistory = this.banEvasionTracker.get(ipAddress) || [];
      const recentBannedUsers = ipHistory.filter(entry => {
        const timeDiff = Date.now() - entry.timestamp.getTime();
        return timeDiff < 30 * 24 * 60 * 60 * 1000; // 30 days
      });
      
      for (const entry of recentBannedUsers) {
        if (entry.userId !== userId) {
          const userRecord = await this.getUserViolationRecord(entry.userId, serverId);
          const hasActiveBan = userRecord.punishments.some(p => 
            (p.type === 'temp_ban' || p.type === 'perm_ban') &&
            (!p.expiresAt || p.expiresAt > new Date())
          );
          
          if (hasActiveBan) {
            evidence.push({
              type: 'ip_match',
              score: 0.7,
              details: {
                originalUserId: entry.userId,
                sharedIP: ipAddress,
                lastSeen: entry.timestamp
              }
            });
            totalConfidence += 0.7;
            suspectedOriginalUserId = entry.userId;
          }
        }
      }
      
      // Check user agent similarity
      for (const entry of recentBannedUsers) {
        if (entry.metadata?.userAgent && this.calculateUserAgentSimilarity(userAgent, entry.metadata.userAgent) > 0.8) {
          evidence.push({
            type: 'user_agent_match',
            score: 0.5,
            details: {
              originalUserId: entry.userId,
              userAgentSimilarity: this.calculateUserAgentSimilarity(userAgent, entry.metadata.userAgent)
            }
          });
          totalConfidence += 0.5;
          if (!suspectedOriginalUserId) suspectedOriginalUserId = entry.userId;
        }
      }
      
      // Check behavior patterns (simplified)
      if (suspectedOriginalUserId) {
        const originalRecord = await this.getUserViolationRecord(suspectedOriginalUserId, serverId);
        const currentRecord = await this.getUserViolationRecord(userId, serverId);
        
        const behaviorSimilarity = this.calculateBehaviorSimilarity(originalRecord, currentRecord);
        if (behaviorSimilarity > 0.6) {
          evidence.push({
            type: 'behavior_pattern',
            score: behaviorSimilarity,
            details: {
              originalUserId: suspectedOriginalUserId,
              similarity: behaviorSimilarity
            }
          });
          totalConfidence += behaviorSimilarity;
        }
      }
      
      // Normalize confidence
      const finalConfidence = Math.min(totalConfidence, 1.0);
      
      if (finalConfidence > 0.6 && suspectedOriginalUserId) {
        const detection: BanEvasionDetection = {
          suspectedUserId: userId,
          originalUserId: suspectedOriginalUserId,
          confidence: finalConfidence,
          evidence,
          timestamp: new Date(),
          actionTaken: false
        };
        
        // Take action if confidence is high enough
        if (finalConfidence > 0.8) {
          await this.handleBanEvasion(detection, serverId);
          detection.actionTaken = true;
        }
        
        return detection;
      }
      
      return null;
    } catch (error) {
      console.error('Ban evasion detection failed:', error);
      return null;
    }
  }

  /**
   * Handle detected ban evasion
   */
  private async handleBanEvasion(detection: BanEvasionDetection, serverId?: string): Promise<void> {
    try {
      // Apply the same punishment as the original user
      const originalRecord = await this.getUserViolationRecord(detection.originalUserId, serverId);
      const activeBan = originalRecord.punishments.find(p => 
        (p.type === 'temp_ban' || p.type === 'perm_ban') &&
        (!p.expiresAt || p.expiresAt > new Date())
      );
      
      if (activeBan) {
        const punishment = {
          type: activeBan.type,
          duration: activeBan.expiresAt ? 
            Math.floor((activeBan.expiresAt.getTime() - Date.now()) / 1000) : undefined,
          reason: `Ban evasion detected (${(detection.confidence * 100).toFixed(1)}% confidence)`,
          issuedBy: 'system',
          timestamp: new Date(),
          appealable: true
        };
        
        await this.issuePunishment(
          detection.suspectedUserId,
          punishment,
          [],
          serverId
        );
        
        // Notify moderators
        await this.queue.add('notify-ban-evasion', {
          suspectedUserId: detection.suspectedUserId,
          originalUserId: detection.originalUserId,
          confidence: detection.confidence,
          evidence: detection.evidence,
          serverId,
          actionTaken: 'automatic_ban'
        });
        
        console.log(`🚨 Ban evasion handled: ${detection.suspectedUserId} (original: ${detection.originalUserId})`);
      }
    } catch (error) {
      console.error('Failed to handle ban evasion:', error);
    }
  }

  /**
   * Calculate user agent similarity
   */
  private calculateUserAgentSimilarity(ua1: string, ua2: string): number {
    if (!ua1 || !ua2) return 0;
    
    // Simple similarity based on common tokens
    const tokens1 = new Set(ua1.toLowerCase().split(/[^a-z0-9]+/));
    const tokens2 = new Set(ua2.toLowerCase().split(/[^a-z0-9]+/));
    
    const intersection = new Set([...tokens1].filter(token => tokens2.has(token)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate behavior similarity between users
   */
  private calculateBehaviorSimilarity(record1: UserViolationRecord, record2: UserViolationRecord): number {
    let similarity = 0;
    
    // Compare violation patterns
    const types1 = new Set(record1.violations.map(v => v.type));
    const types2 = new Set(record2.violations.map(v => v.type));
    const commonTypes = new Set([...types1].filter(type => types2.has(type)));
    
    if (types1.size > 0 && types2.size > 0) {
      similarity += (commonTypes.size / Math.max(types1.size, types2.size)) * 0.4;
    }
    
    // Compare timing patterns (simplified)
    const hours1 = record1.violations.map(v => v.timestamp.getHours());
    const hours2 = record2.violations.map(v => v.timestamp.getHours());
    
    if (hours1.length > 0 && hours2.length > 0) {
      const avgHour1 = hours1.reduce((sum, h) => sum + h, 0) / hours1.length;
      const avgHour2 = hours2.reduce((sum, h) => sum + h, 0) / hours2.length;
      const hourSimilarity = 1 - Math.abs(avgHour1 - avgHour2) / 24;
      similarity += hourSimilarity * 0.3;
    }
    
    // Compare escalation patterns
    if (record1.escalationLevel === record2.escalationLevel) {
      similarity += 0.3;
    }
    
    return Math.min(similarity, 1.0);
  }

  /**
   * Track user session for evasion detection
   */
  async trackUserSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    serverId?: string
  ): Promise<void> {
    try {
      // Update user session
      this.userSessions.set(userId, {
        lastSeen: new Date(),
        ipAddress,
        userAgent
      });
      
      // Track IP history for ban evasion detection
      let ipHistory = this.banEvasionTracker.get(ipAddress) || [];
      const existingEntry = ipHistory.find(entry => entry.userId === userId);
      
      if (existingEntry) {
        existingEntry.timestamp = new Date();
        existingEntry.metadata = { userAgent };
      } else {
        ipHistory.push({
          userId,
          timestamp: new Date(),
          metadata: { userAgent }
        });
      }
      
      // Keep only recent entries (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      ipHistory = ipHistory.filter(entry => entry.timestamp > thirtyDaysAgo);
      
      this.banEvasionTracker.set(ipAddress, ipHistory);
      
      // Check for potential ban evasion
      if (this.config.monitoring.detectEvaders) {
        const detection = await this.detectBanEvasion(userId, ipAddress, userAgent, serverId);
        if (detection && detection.confidence > 0.7) {
          console.log(`🔍 Potential ban evasion detected: ${userId} (${(detection.confidence * 100).toFixed(1)}% confidence)`);
        }
      }
    } catch (error) {
      console.error('Failed to track user session:', error);
    }
  }

  /**
   * Helper methods
   */
  private async getUserViolationRecord(userId: string, serverId?: string): Promise<UserViolationRecord> {
    const key = serverId ? `${serverId}:${userId}` : userId;
    let record: UserViolationRecord | undefined;
    
    if (serverId) {
      const serverRecords = this.serverViolations.get(serverId);
      record = serverRecords?.get(userId);
    } else {
      record = this.userViolations.get(userId);
    }
    
    if (!record) {
      record = {
        userId,
        serverId,
        violations: [],
        punishments: [],
        escalationLevel: 0,
        lastViolation: new Date(),
        totalViolations: 0,
        riskScore: 0,
        status: 'clean',
        metadata: {
          ipAddresses: [],
          userAgents: [],
          pattern: [],
          evasionAttempts: 0
        }
      };
      
      this.updateUserRecord(userId, record, serverId);
    }
    
    return record;
  }

  private updateUserRecord(userId: string, record: UserViolationRecord, serverId?: string): void {
    if (serverId) {
      let serverRecords = this.serverViolations.get(serverId);
      if (!serverRecords) {
        serverRecords = new Map();
        this.serverViolations.set(serverId, serverRecords);
      }
      serverRecords.set(userId, record);
    } else {
      this.userViolations.set(userId, record);
    }
  }

  private calculateRiskScore(record: UserViolationRecord): number {
    let score = 0;
    
    // Base score from violation count
    score += Math.min(record.totalViolations * 0.1, 0.5);
    
    // Recent violation boost
    const recentViolations = record.violations.filter(v => 
      Date.now() - v.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    score += Math.min(recentViolations.length * 0.15, 0.3);
    
    // Severity boost
    const criticalViolations = record.violations.filter(v => v.severity === 'critical').length;
    score += Math.min(criticalViolations * 0.2, 0.4);
    
    // Escalation level
    score += Math.min(record.escalationLevel * 0.05, 0.2);
    
    return Math.min(score, 1.0);
  }

  private generateViolationId(): string {
    return `viol_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generatePunishmentId(): string {
    return `pun_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateAppealId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Logging and audit
   */
  private async logEnforcementAction(
    userId: string,
    violation: any,
    punishment: any,
    serverId?: string
  ): Promise<void> {
    try {
      if (serverId) {
        await prisma.auditLog.create({
          data: {
            serverId,
            userId: 'system',
            targetId: userId,
            actionType: 991, // Automated enforcement action type
            reason: `Automated ${punishment.type}: ${punishment.reason}`,
            options: {
              violationType: violation.type,
              violationSeverity: violation.severity,
              punishmentType: punishment.type,
              duration: punishment.duration,
              violationId: violation.id,
              evidence: violation.evidence,
              automated: true,
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      console.log(`⚖️ Automated enforcement: ${userId} - ${punishment.type} for ${violation.type} violation`);
    } catch (error) {
      console.error('Failed to log enforcement action:', error);
    }
  }

  private async logAppeal(appeal: AppealRequest): Promise<void> {
    try {
      if (appeal.serverId) {
        await prisma.auditLog.create({
          data: {
            serverId: appeal.serverId,
            userId: 'system',
            targetId: appeal.userId,
            actionType: 990, // Appeal submission action type
            reason: `Appeal submitted for punishment ${appeal.punishmentId}`,
            options: {
              appealId: appeal.id,
              punishmentId: appeal.punishmentId,
              reason: appeal.reason,
              hasEvidence: !!appeal.evidence,
              timestamp: appeal.timestamp.toISOString()
            },
            changes: null
          }
        });
      }
    } catch (error) {
      console.error('Failed to log appeal:', error);
    }
  }

  /**
   * Initialize default escalation rules
   */
  private initializeEscalationRules(): void {
    const rules: EscalationRule[] = [
      {
        id: 'critical_immediate_ban',
        name: 'Critical Violation Immediate Ban',
        description: 'Immediate temp ban for critical violations with history',
        conditions: [
          { field: 'severity', operator: 'equals', value: 'critical' },
          { field: 'violation_count', operator: 'greater_equal', value: 2, timeWindow: 168 } // 1 week
        ],
        action: {
          type: 'temp_ban',
          duration: 7 * 24 * 60 * 60, // 7 days
          reason: 'Critical violation with recent violation history'
        },
        priority: 10,
        enabled: true
      },
      {
        id: 'rapid_violations',
        name: 'Rapid Multiple Violations',
        description: 'Multiple violations in short timeframe',
        conditions: [
          { field: 'violation_count', operator: 'greater_equal', value: 3, timeWindow: 1 }
        ],
        action: {
          type: 'timeout',
          duration: 12 * 60 * 60, // 12 hours
          reason: 'Multiple violations in short timeframe'
        },
        priority: 8,
        enabled: true
      },
      {
        id: 'escalation_progression',
        name: 'Standard Escalation Progression',
        description: 'Progressive punishment based on violation count',
        conditions: [
          { field: 'violation_count', operator: 'greater_equal', value: 5 }
        ],
        action: {
          type: 'temp_ban',
          duration: 24 * 60 * 60, // 24 hours
          reason: 'Repeated rule violations'
        },
        priority: 5,
        enabled: true
      },
      {
        id: 'high_risk_user',
        name: 'High Risk User',
        description: 'User with high calculated risk score',
        conditions: [
          { field: 'risk_score', operator: 'greater_equal', value: 0.8 }
        ],
        action: {
          type: 'temp_ban',
          duration: 3 * 24 * 60 * 60, // 3 days
          reason: 'High-risk user behavior pattern',
          requiresApproval: true
        },
        priority: 7,
        enabled: true
      }
    ];

    for (const rule of rules) {
      this.escalationRules.set(rule.id, rule);
    }
  }

  /**
   * Start monitoring and cleanup processes
   */
  private startMonitoring(): void {
    // Clean up expired punishments
    setInterval(() => {
      this.cleanupExpiredPunishments();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Clean up old session data
    setInterval(() => {
      this.cleanupOldSessions();
    }, 60 * 60 * 1000); // Every hour

    // Process automatic appeal reviews
    if (this.config.appeals.enableAppeals) {
      setInterval(() => {
        this.processAutoAppeals();
      }, 15 * 60 * 1000); // Every 15 minutes
    }

    console.log('🔍 Automated ban system monitoring started');
  }

  private cleanupExpiredPunishments(): void {
    const now = Date.now();
    
    for (const [punishmentId, cached] of this.punishmentCache.entries()) {
      if (cached.expiresAt && cached.expiresAt.getTime() <= now) {
        // Queue punishment expiry
        this.queue.add('expire-punishment', {
          userId: cached.userId,
          punishmentId,
          type: cached.type
        });
        
        this.punishmentCache.delete(punishmentId);
      }
    }
  }

  private cleanupOldSessions(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [userId, session] of this.userSessions.entries()) {
      if (session.lastSeen < oneDayAgo) {
        this.userSessions.delete(userId);
      }
    }
  }

  private processAutoAppeals(): void {
    const autoReviewThreshold = new Date(Date.now() - 
      this.config.appeals.autoReviewThreshold * 24 * 60 * 60 * 1000);
    
    for (const [appealId, appeal] of this.activeAppeals.entries()) {
      if (appeal.status === 'pending' && appeal.timestamp < autoReviewThreshold) {
        // Auto-review very old appeals
        this.queue.add('auto-review-appeal', {
          appealId,
          reason: 'Automatic review due to age'
        });
      }
    }
  }

  /**
   * Configuration management
   */
  private getDefaultConfig(): BanSystemConfig {
    return {
      escalation: {
        enableAutoEscalation: true,
        escalationThresholds: {
          warningCount: 3,
          timeoutCount: 2,
          tempBanCount: 2
        },
        escalationWindows: {
          warnings: 24,
          timeouts: 168, // 1 week
          bans: 720 // 30 days
        }
      },
      punishments: {
        warning: {
          enabled: true,
          maxPerDay: 3,
          duration: 0
        },
        timeout: {
          enabled: true,
          durations: [60 * 60, 4 * 60 * 60, 12 * 60 * 60, 24 * 60 * 60], // 1h, 4h, 12h, 24h
          maxPerDay: 2
        },
        tempBan: {
          enabled: true,
          durations: [24 * 60 * 60, 3 * 24 * 60 * 60, 7 * 24 * 60 * 60, 30 * 24 * 60 * 60], // 1d, 3d, 7d, 30d
          maxPerWeek: 1
        },
        permaBan: {
          enabled: true,
          requiresApproval: true,
          minimumViolations: 10
        }
      },
      appeals: {
        enableAppeals: true,
        cooldownPeriod: 24, // 24 hours
        maxAppealsPerPunishment: 2,
        autoReviewThreshold: 7 // days
      },
      monitoring: {
        trackPatterns: true,
        detectEvaders: true,
        crossServerTracking: false,
        ipTracking: true
      }
    };
  }

  updateConfig(newConfig: Partial<BanSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalViolations: number;
    totalPunishments: number;
    activeAppeals: number;
    banEvasionDetections: number;
    punishmentsByType: { [type: string]: number };
    averageEscalationLevel: number;
  } {
    let totalViolations = 0;
    let totalPunishments = 0;
    let totalEscalationLevels = 0;
    const punishmentsByType: { [type: string]: number } = {};
    
    // Count global violations
    for (const record of this.userViolations.values()) {
      totalViolations += record.violations.length;
      totalPunishments += record.punishments.length;
      totalEscalationLevels += record.escalationLevel;
      
      for (const punishment of record.punishments) {
        punishmentsByType[punishment.type] = (punishmentsByType[punishment.type] || 0) + 1;
      }
    }
    
    // Count server-specific violations
    for (const serverRecords of this.serverViolations.values()) {
      for (const record of serverRecords.values()) {
        totalViolations += record.violations.length;
        totalPunishments += record.punishments.length;
        totalEscalationLevels += record.escalationLevel;
        
        for (const punishment of record.punishments) {
          punishmentsByType[punishment.type] = (punishmentsByType[punishment.type] || 0) + 1;
        }
      }
    }
    
    const totalUsers = this.userViolations.size + 
      Array.from(this.serverViolations.values()).reduce((sum, records) => sum + records.size, 0);
    
    return {
      totalViolations,
      totalPunishments,
      activeAppeals: this.activeAppeals.size,
      banEvasionDetections: 0, // Would track actual detections
      punishmentsByType,
      averageEscalationLevel: totalUsers > 0 ? totalEscalationLevels / totalUsers : 0
    };
  }
}