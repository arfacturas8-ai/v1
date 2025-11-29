import { prisma } from '@cryb/database';
import { createHash } from 'crypto';

interface AuditLogEntry {
  event_type: string;
  actor_id?: string;
  target_id?: string;
  target_type?: string;
  action: string;
  details: any;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  risk_score?: number;
}

interface ModerationAuditReport {
  timeframe: string;
  total_events: number;
  events_by_type: Record<string, number>;
  actions_by_moderator: any[];
  security_incidents: any[];
  compliance_summary: any;
  risk_assessment: any;
}

export class ModerationAuditService {
  private readonly SENSITIVE_FIELDS = [
    'password', 'token', 'secret', 'key', 'hash',
    'email', 'phone', 'ssn', 'credit_card'
  ];

  /**
   * Log a moderation audit event
   */
  async logEvent(entry: AuditLogEntry): Promise<string> {
    try {
      const auditId = this.generateAuditId();
      const sanitizedDetails = this.sanitizeData(entry.details);
      const eventHash = this.calculateEventHash(entry);

      await prisma.$executeRawUnsafe(`
        INSERT INTO moderation_audit_log (
          id, event_type, actor_id, target_id, target_type,
          action, details, metadata, ip_address, user_agent,
          session_id, risk_score, event_hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      `,
        auditId, entry.event_type, entry.actor_id, entry.target_id, entry.target_type,
        entry.action, JSON.stringify(sanitizedDetails), JSON.stringify(entry.metadata || {}),
        entry.ip_address, entry.user_agent, entry.session_id, entry.risk_score || 0,
        eventHash
      );

      // Check for suspicious patterns
      await this.detectSuspiciousActivity(entry);

      return auditId;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  /**
   * Log moderation action with full context
   */
  async logModerationAction(data: {
    action_id: string;
    action_type: string;
    moderator_id?: string;
    target_user_id: string;
    target_content_id?: string;
    reason: string;
    evidence?: any;
    auto_generated: boolean;
    rule_triggered?: string;
    ai_confidence?: number;
    context: any;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'moderation_action',
      actor_id: data.moderator_id || 'system',
      target_id: data.target_user_id,
      target_type: 'user',
      action: data.action_type,
      details: {
        action_id: data.action_id,
        target_content_id: data.target_content_id,
        reason: data.reason,
        evidence: data.evidence,
        auto_generated: data.auto_generated,
        rule_triggered: data.rule_triggered,
        ai_confidence: data.ai_confidence,
        context: data.context,
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      risk_score: this.calculateActionRiskScore(data),
    });
  }

  /**
   * Log report submission
   */
  async logReportSubmission(data: {
    report_id: string;
    reporter_id: string;
    reported_user_id: string;
    content_id: string;
    content_type: string;
    category: string;
    description: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'report_submission',
      actor_id: data.reporter_id,
      target_id: data.reported_user_id,
      target_type: 'user',
      action: 'report_submitted',
      details: {
        report_id: data.report_id,
        content_id: data.content_id,
        content_type: data.content_type,
        category: data.category,
        description_hash: createHash('sha256').update(data.description).digest('hex'),
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      risk_score: await this.calculateReportRiskScore(data),
    });
  }

  /**
   * Log appeal submission and review
   */
  async logAppealActivity(data: {
    appeal_id: string;
    activity_type: 'submitted' | 'reviewed' | 'approved' | 'denied';
    appellant_id?: string;
    reviewer_id?: string;
    action_id: string;
    decision?: string;
    notes?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'appeal_activity',
      actor_id: data.reviewer_id || data.appellant_id,
      target_id: data.action_id,
      target_type: 'moderation_action',
      action: data.activity_type,
      details: {
        appeal_id: data.appeal_id,
        decision: data.decision,
        notes_hash: data.notes ? createHash('sha256').update(data.notes).digest('hex') : null,
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent,
    });
  }

  /**
   * Log AI analysis results
   */
  async logAIAnalysis(data: {
    content_id: string;
    content_type: string;
    model_name: string;
    analysis_result: any;
    processing_time: number;
    flagged: boolean;
    confidence: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'ai_analysis',
      actor_id: 'ai_system',
      target_id: data.content_id,
      target_type: data.content_type,
      action: 'content_analyzed',
      details: {
        model_name: data.model_name,
        flagged: data.flagged,
        confidence: data.confidence,
        processing_time: data.processing_time,
        categories: data.analysis_result.flagged_categories,
        scores: {
          toxicity: data.analysis_result.toxicity_score,
          spam: data.analysis_result.spam_score,
          hate_speech: data.analysis_result.hate_speech_score,
        },
      },
      metadata: {
        model_version: data.analysis_result.model_version,
        analysis_timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log system configuration changes
   */
  async logConfigurationChange(data: {
    moderator_id: string;
    config_type: string;
    changes: any;
    previous_values?: any;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'configuration_change',
      actor_id: data.moderator_id,
      target_type: 'system_config',
      action: 'config_updated',
      details: {
        config_type: data.config_type,
        changes: data.changes,
        previous_values: data.previous_values,
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      risk_score: 5, // Config changes are always high risk
    });
  }

  /**
   * Generate comprehensive audit report
   */
  async generateAuditReport(
    timeframe: '24h' | '7d' | '30d' | '90d' = '7d',
    filters: {
      event_type?: string;
      actor_id?: string;
      target_type?: string;
      min_risk_score?: number;
    } = {}
  ): Promise<ModerationAuditReport> {
    try {
      const timeFilter = this.getTimeFilter(timeframe);
      let whereClause = `WHERE ${timeFilter}`;
      const params: any[] = [];

      // Add filters
      if (filters.event_type) {
        whereClause += ` AND event_type = $${params.length + 1}`;
        params.push(filters.event_type);
      }

      if (filters.actor_id) {
        whereClause += ` AND actor_id = $${params.length + 1}`;
        params.push(filters.actor_id);
      }

      if (filters.target_type) {
        whereClause += ` AND target_type = $${params.length + 1}`;
        params.push(filters.target_type);
      }

      if (filters.min_risk_score) {
        whereClause += ` AND risk_score >= $${params.length + 1}`;
        params.push(filters.min_risk_score);
      }

      // Get total events
      const totalResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as total FROM moderation_audit_log ${whereClause}
      `, ...params);
      const totalEvents = parseInt((totalResult as any[])[0].total);

      // Get events by type
      const eventsByType = await prisma.$queryRawUnsafe(`
        SELECT event_type, COUNT(*) as count
        FROM moderation_audit_log ${whereClause}
        GROUP BY event_type
        ORDER BY count DESC
      `, ...params);

      // Get actions by moderator
      const actionsByModerator = await prisma.$queryRawUnsafe(`
        SELECT 
          mal.actor_id,
          u.username,
          COUNT(*) as action_count,
          AVG(mal.risk_score) as avg_risk_score,
          COUNT(*) FILTER (WHERE mal.event_type = 'moderation_action') as moderation_actions,
          COUNT(*) FILTER (WHERE mal.event_type = 'appeal_activity') as appeal_reviews
        FROM moderation_audit_log mal
        LEFT JOIN users u ON mal.actor_id = u.id
        ${whereClause}
        AND mal.actor_id != 'system' AND mal.actor_id != 'ai_system'
        GROUP BY mal.actor_id, u.username
        ORDER BY action_count DESC
        LIMIT 20
      `, ...params);

      // Get security incidents (high risk events)
      const securityIncidents = await prisma.$queryRawUnsafe(`
        SELECT 
          event_type, action, actor_id, target_id, risk_score, created_at,
          details, ip_address
        FROM moderation_audit_log
        ${whereClause}
        AND risk_score >= 7
        ORDER BY created_at DESC
        LIMIT 50
      `, ...params);

      // Generate compliance summary
      const complianceSummary = await this.generateComplianceSummary(timeframe);

      // Generate risk assessment
      const riskAssessment = await this.generateRiskAssessment(timeframe);

      return {
        timeframe,
        total_events: totalEvents,
        events_by_type: Object.fromEntries(
          (eventsByType as any[]).map(row => [row.event_type, parseInt(row.count)])
        ),
        actions_by_moderator: actionsByModerator as any[],
        security_incidents: securityIncidents as any[],
        compliance_summary: complianceSummary,
        risk_assessment: riskAssessment,
      };
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  /**
   * Search audit logs with advanced filtering
   */
  async searchAuditLogs(query: {
    keywords?: string[];
    event_types?: string[];
    actor_ids?: string[];
    target_ids?: string[];
    date_from?: Date;
    date_to?: Date;
    min_risk_score?: number;
    ip_address?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: any[];
    total: number;
    aggregations: any;
  }> {
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      // Build search conditions
      if (query.event_types && query.event_types.length > 0) {
        whereClause += ` AND event_type = ANY($${params.length + 1})`;
        params.push(query.event_types);
      }

      if (query.actor_ids && query.actor_ids.length > 0) {
        whereClause += ` AND actor_id = ANY($${params.length + 1})`;
        params.push(query.actor_ids);
      }

      if (query.date_from) {
        whereClause += ` AND created_at >= $${params.length + 1}`;
        params.push(query.date_from);
      }

      if (query.date_to) {
        whereClause += ` AND created_at <= $${params.length + 1}`;
        params.push(query.date_to);
      }

      if (query.min_risk_score) {
        whereClause += ` AND risk_score >= $${params.length + 1}`;
        params.push(query.min_risk_score);
      }

      if (query.ip_address) {
        whereClause += ` AND ip_address = $${params.length + 1}`;
        params.push(query.ip_address);
      }

      // Get logs
      const logsQuery = `
        SELECT mal.*, u.username as actor_username
        FROM moderation_audit_log mal
        LEFT JOIN users u ON mal.actor_id = u.id
        ${whereClause}
        ORDER BY mal.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(query.limit || 100, query.offset || 0);
      const logs = await prisma.$queryRawUnsafe(logsQuery, ...params);

      // Get total count
      const countResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as total FROM moderation_audit_log ${whereClause}
      `, ...params.slice(0, -2));
      const total = parseInt((countResult as any[])[0].total);

      // Get aggregations
      const aggregations = await this.getLogAggregations(whereClause, params.slice(0, -2));

      return {
        logs: logs as any[],
        total,
        aggregations,
      };
    } catch (error) {
      console.error('Error searching audit logs:', error);
      return { logs: [], total: 0, aggregations: {} };
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(
    format: 'json' | 'csv' | 'xml',
    filters: any = {},
    timeframe: string = '30d'
  ): Promise<{
    data: string;
    filename: string;
    contentType: string;
  }> {
    try {
      const timeFilter = this.getTimeFilter(timeframe);
      const logs = await prisma.$queryRawUnsafe(`
        SELECT 
          id, event_type, actor_id, target_id, target_type,
          action, details, created_at, ip_address, risk_score,
          event_hash
        FROM moderation_audit_log
        WHERE ${timeFilter}
        ORDER BY created_at DESC
      `);

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `audit_logs_${timestamp}.${format}`;

      let data: string;
      let contentType: string;

      switch (format) {
        case 'json':
          data = JSON.stringify(logs, null, 2);
          contentType = 'application/json';
          break;
        case 'csv':
          data = this.convertToCSV(logs as any[]);
          contentType = 'text/csv';
          break;
        case 'xml':
          data = this.convertToXML(logs as any[]);
          contentType = 'application/xml';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      return { data, filename, contentType };
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  // Helper methods

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    
    for (const field of this.SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  private calculateEventHash(entry: AuditLogEntry): string {
    const hashData = JSON.stringify({
      event_type: entry.event_type,
      actor_id: entry.actor_id,
      target_id: entry.target_id,
      action: entry.action,
      timestamp: Date.now(),
    });
    
    return createHash('sha256').update(hashData).digest('hex');
  }

  private calculateActionRiskScore(data: any): number {
    let score = 0;

    // Base risk by action type
    switch (data.action_type) {
      case 'ban': score += 8; break;
      case 'remove': score += 6; break;
      case 'quarantine': score += 5; break;
      case 'timeout': score += 3; break;
      case 'warn': score += 1; break;
      default: score += 2;
    }

    // Increase risk for manual actions
    if (!data.auto_generated) {
      score += 2;
    }

    // Increase risk for low AI confidence
    if (data.ai_confidence && data.ai_confidence < 0.7) {
      score += 3;
    }

    return Math.min(score, 10);
  }

  private async calculateReportRiskScore(data: any): Promise<number> {
    try {
      // Check reporter's history
      const reporterHistory = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as total_reports,
          COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_reports
        FROM content_reports
        WHERE reporter_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
      `, data.reporter_id);

      const history = (reporterHistory as any[])[0];
      const falsereportRate = history.total_reports > 0 
        ? history.dismissed_reports / history.total_reports 
        : 0;

      let score = 0;

      // High false report rate increases risk
      if (falsereportRate > 0.5) {
        score += 5;
      } else if (falsereportRate > 0.3) {
        score += 3;
      }

      // Many reports in short time increases risk
      if (history.total_reports > 10) {
        score += 4;
      } else if (history.total_reports > 5) {
        score += 2;
      }

      return Math.min(score, 10);
    } catch (error) {
      console.error('Error calculating report risk score:', error);
      return 0;
    }
  }

  private async detectSuspiciousActivity(entry: AuditLogEntry): Promise<void> {
    try {
      // Check for rapid-fire actions from same actor
      if (entry.actor_id && entry.actor_id !== 'system') {
        const recentActions = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count
          FROM moderation_audit_log
          WHERE actor_id = $1
          AND created_at >= NOW() - INTERVAL '5 minutes'
        `, entry.actor_id);

        const count = parseInt((recentActions as any[])[0].count);
        if (count > 20) {
          await this.flagSuspiciousActivity(entry.actor_id, 'rapid_fire_actions', {
            action_count: count,
            timeframe: '5 minutes',
          });
        }
      }

      // Check for unusual IP patterns
      if (entry.ip_address) {
        const ipActions = await prisma.$queryRawUnsafe(`
          SELECT COUNT(DISTINCT actor_id) as unique_actors
          FROM moderation_audit_log
          WHERE ip_address = $1
          AND created_at >= NOW() - INTERVAL '1 hour'
        `, entry.ip_address);

        const uniqueActors = parseInt((ipActions as any[])[0].unique_actors);
        if (uniqueActors > 5) {
          await this.flagSuspiciousActivity(entry.ip_address, 'multiple_actors_same_ip', {
            unique_actors: uniqueActors,
            ip_address: entry.ip_address,
          });
        }
      }
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
    }
  }

  private async flagSuspiciousActivity(identifier: string, type: string, details: any): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO security_incidents (
          id, incident_type, identifier, details, severity, status, created_at
        ) VALUES ($1, $2, $3, $4, 'high', 'open', NOW())
        ON CONFLICT (identifier, incident_type) DO UPDATE SET
          details = $4, updated_at = NOW()
      `, 
        `incident_${Date.now()}`, type, identifier, JSON.stringify(details)
      );
    } catch (error) {
      console.error('Error flagging suspicious activity:', error);
    }
  }

  private async generateComplianceSummary(timeframe: string): Promise<any> {
    try {
      const timeFilter = this.getTimeFilter(timeframe);
      
      const summary = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) FILTER (WHERE event_type = 'moderation_action') as moderation_actions,
          COUNT(*) FILTER (WHERE event_type = 'report_submission') as reports_submitted,
          COUNT(*) FILTER (WHERE event_type = 'appeal_activity') as appeals_processed,
          COUNT(*) FILTER (WHERE event_type = 'configuration_change') as config_changes,
          COUNT(*) FILTER (WHERE risk_score >= 7) as high_risk_events
        FROM moderation_audit_log
        WHERE ${timeFilter}
      `);

      return (summary as any[])[0];
    } catch (error) {
      console.error('Error generating compliance summary:', error);
      return {};
    }
  }

  private async generateRiskAssessment(timeframe: string): Promise<any> {
    try {
      const timeFilter = this.getTimeFilter(timeframe);
      
      const assessment = await prisma.$queryRawUnsafe(`
        SELECT 
          AVG(risk_score) as avg_risk_score,
          COUNT(*) FILTER (WHERE risk_score >= 8) as critical_events,
          COUNT(*) FILTER (WHERE risk_score >= 5 AND risk_score < 8) as high_events,
          COUNT(*) FILTER (WHERE risk_score >= 3 AND risk_score < 5) as medium_events,
          COUNT(*) FILTER (WHERE risk_score < 3) as low_events
        FROM moderation_audit_log
        WHERE ${timeFilter}
      `);

      return (assessment as any[])[0];
    } catch (error) {
      console.error('Error generating risk assessment:', error);
      return {};
    }
  }

  private async getLogAggregations(whereClause: string, params: any[]): Promise<any> {
    try {
      const eventTypes = await prisma.$queryRawUnsafe(`
        SELECT event_type, COUNT(*) as count
        FROM moderation_audit_log ${whereClause}
        GROUP BY event_type
      `, ...params);

      const riskDistribution = await prisma.$queryRawUnsafe(`
        SELECT 
          CASE 
            WHEN risk_score >= 8 THEN 'critical'
            WHEN risk_score >= 5 THEN 'high'
            WHEN risk_score >= 3 THEN 'medium'
            ELSE 'low'
          END as risk_level,
          COUNT(*) as count
        FROM moderation_audit_log ${whereClause}
        GROUP BY risk_level
      `, ...params);

      return {
        event_types: eventTypes,
        risk_distribution: riskDistribution,
      };
    } catch (error) {
      console.error('Error getting log aggregations:', error);
      return {};
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  private convertToXML(data: any[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<audit_logs>\n';
    
    for (const log of data) {
      xml += '  <log>\n';
      for (const [key, value] of Object.entries(log)) {
        xml += `    <${key}>${this.escapeXML(String(value || ''))}</${key}>\n`;
      }
      xml += '  </log>\n';
    }
    
    xml += '</audit_logs>';
    return xml;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private getTimeFilter(timeframe: string): string {
    switch (timeframe) {
      case '24h': return "created_at >= NOW() - INTERVAL '24 hours'";
      case '7d': return "created_at >= NOW() - INTERVAL '7 days'";
      case '30d': return "created_at >= NOW() - INTERVAL '30 days'";
      case '90d': return "created_at >= NOW() - INTERVAL '90 days'";
      default: return "created_at >= NOW() - INTERVAL '7 days'";
    }
  }
}

export const moderationAuditService = new ModerationAuditService();