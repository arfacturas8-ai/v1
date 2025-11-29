import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { z } from 'zod';

// Validation schemas
const ModerationThresholdSchema = z.object({
  toxicity: z.number().min(0).max(1),
  hate_speech: z.number().min(0).max(1),
  harassment: z.number().min(0).max(1),
  spam: z.number().min(0).max(1),
  nsfw: z.number().min(0).max(1),
  violence: z.number().min(0).max(1),
  self_harm: z.number().min(0).max(1),
  identity_attack: z.number().min(0).max(1),
  profanity: z.number().min(0).max(1),
  threat: z.number().min(0).max(1)
});

const ModerationRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  rule_type: z.enum(['keyword', 'pattern', 'ai_threshold', 'user_behavior', 'custom']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  action: z.enum(['flag', 'hide', 'remove', 'quarantine', 'ban', 'warn']),
  auto_action: z.boolean().default(false),
  enabled: z.boolean().default(true),
  config: z.object({}).passthrough(),
  community_id: z.string().optional(),
  server_id: z.string().optional()
});

const AutoActionThresholdSchema = z.object({
  critical_threshold: z.number().min(0).max(1),
  high_threshold: z.number().min(0).max(1),
  medium_threshold: z.number().min(0).max(1),
  low_threshold: z.number().min(0).max(1)
});

const RateLimitConfigSchema = z.object({
  requests_per_minute: z.number().min(1).max(1000),
  burst_limit: z.number().min(1).max(100),
  enabled: z.boolean().default(true)
});

export interface ModerationConfig {
  thresholds: z.infer<typeof ModerationThresholdSchema>;
  auto_actions: z.infer<typeof AutoActionThresholdSchema>;
  rate_limits: z.infer<typeof RateLimitConfigSchema>;
  openai_config: {
    api_key: string;
    model: string;
    max_tokens: number;
    temperature: number;
  };
  fallback_enabled: boolean;
  cache_duration_minutes: number;
  notification_settings: {
    notify_on_high_severity: boolean;
    notify_on_auto_actions: boolean;
    admin_notification_threshold: number;
  };
  whitelist: {
    users: string[];
    domains: string[];
    ip_addresses: string[];
  };
  blacklist: {
    users: string[];
    domains: string[];
    ip_addresses: string[];
    keywords: string[];
  };
}

export class ModerationConfigService {
  private prisma: PrismaClient;
  private redis: Redis;
  private cache_prefix = 'moderation:config:';
  private cache_ttl = 300; // 5 minutes

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Get complete moderation configuration
   */
  async getConfig(
    communityId?: string,
    serverId?: string
  ): Promise<ModerationConfig> {
    try {
      const cacheKey = `${this.cache_prefix}${communityId || 'global'}:${serverId || 'global'}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const config = await this.buildConfig(communityId, serverId);
      
      // Cache the configuration
      await this.redis.setex(cacheKey, this.cache_ttl, JSON.stringify(config));
      
      return config;
    } catch (error) {
      console.error('Error getting moderation config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Update moderation thresholds
   */
  async updateThresholds(
    thresholds: Partial<z.infer<typeof ModerationThresholdSchema>>,
    communityId?: string,
    serverId?: string,
    updatedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate input
      const validated = ModerationThresholdSchema.partial().parse(thresholds);
      
      // Get current config
      const currentConfig = await this.getConfig(communityId, serverId);
      const newThresholds = { ...currentConfig.thresholds, ...validated };
      
      // Store in database
      await this.storeConfigSetting('thresholds', newThresholds, communityId, serverId, updatedBy);
      
      // Clear cache
      await this.clearConfigCache(communityId, serverId);
      
      // Log the change
      await this.logConfigChange('thresholds', thresholds, updatedBy, communityId, serverId);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating thresholds:', error);
      return { success: false, error: 'Failed to update thresholds' };
    }
  }

  /**
   * Create or update moderation rule
   */
  async createRule(
    ruleData: z.infer<typeof ModerationRuleSchema>,
    createdBy?: string
  ): Promise<{ success: boolean; ruleId?: string; error?: string }> {
    try {
      // Validate input
      const validated = ModerationRuleSchema.parse(ruleData);
      
      // Check for duplicate rule names in the same scope
      const existingRule = await this.findRuleByName(
        validated.name, 
        validated.community_id, 
        validated.server_id
      );
      
      if (existingRule) {
        return { success: false, error: 'Rule with this name already exists' };
      }
      
      // Create the rule
      const ruleId = await this.prisma.$queryRawUnsafe(`
        INSERT INTO moderation_rules (
          name, description, rule_type, severity, action, auto_action,
          enabled, config, community_id, server_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, 
        validated.name, validated.description, validated.rule_type,
        validated.severity, validated.action, validated.auto_action,
        validated.enabled, JSON.stringify(validated.config),
        validated.community_id, validated.server_id, createdBy
      ) as any[];
      
      // Clear cache
      await this.clearConfigCache(validated.community_id, validated.server_id);
      
      // Log the creation
      await this.logConfigChange('rule_created', validated, createdBy, validated.community_id, validated.server_id);
      
      return { success: true, ruleId: ruleId[0]?.id };
    } catch (error) {
      console.error('Error creating rule:', error);
      return { success: false, error: 'Failed to create rule' };
    }
  }

  /**
   * Update existing moderation rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<z.infer<typeof ModerationRuleSchema>>,
    updatedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing rule
      const existingRule = await this.getRuleById(ruleId);
      if (!existingRule) {
        return { success: false, error: 'Rule not found' };
      }
      
      // Validate updates
      const validated = ModerationRuleSchema.partial().parse(updates);
      
      // Build update query
      const updateFields = [];
      const params = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(validated)) {
        if (key === 'config') {
          updateFields.push(`config = $${paramIndex++}`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      }
      
      updateFields.push(`updated_at = NOW()`);
      params.push(ruleId);
      
      await this.prisma.$queryRawUnsafe(`
        UPDATE moderation_rules 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `, ...params);
      
      // Clear cache
      await this.clearConfigCache(existingRule.community_id, existingRule.server_id);
      
      // Log the update
      await this.logConfigChange('rule_updated', { ruleId, updates }, updatedBy, existingRule.community_id, existingRule.server_id);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating rule:', error);
      return { success: false, error: 'Failed to update rule' };
    }
  }

  /**
   * Delete moderation rule
   */
  async deleteRule(
    ruleId: string,
    deletedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existingRule = await this.getRuleById(ruleId);
      if (!existingRule) {
        return { success: false, error: 'Rule not found' };
      }
      
      await this.prisma.$queryRawUnsafe(`
        DELETE FROM moderation_rules WHERE id = $1
      `, ruleId);
      
      // Clear cache
      await this.clearConfigCache(existingRule.community_id, existingRule.server_id);
      
      // Log the deletion
      await this.logConfigChange('rule_deleted', { ruleId }, deletedBy, existingRule.community_id, existingRule.server_id);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting rule:', error);
      return { success: false, error: 'Failed to delete rule' };
    }
  }

  /**
   * Get all moderation rules for a scope
   */
  async getRules(
    communityId?: string,
    serverId?: string,
    filters: {
      enabled?: boolean;
      rule_type?: string;
      severity?: string;
    } = {}
  ): Promise<any[]> {
    try {
      const whereConditions = [];
      const params = [];
      let paramIndex = 1;
      
      // Scope conditions
      whereConditions.push(`(community_id IS NULL OR community_id = $${paramIndex++})`);
      params.push(communityId || null);
      
      whereConditions.push(`(server_id IS NULL OR server_id = $${paramIndex++})`);
      params.push(serverId || null);
      
      // Filter conditions
      if (filters.enabled !== undefined) {
        whereConditions.push(`enabled = $${paramIndex++}`);
        params.push(filters.enabled);
      }
      
      if (filters.rule_type) {
        whereConditions.push(`rule_type = $${paramIndex++}`);
        params.push(filters.rule_type);
      }
      
      if (filters.severity) {
        whereConditions.push(`severity = $${paramIndex++}`);
        params.push(filters.severity);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      const rules = await this.prisma.$queryRawUnsafe(`
        SELECT * FROM moderation_rules
        WHERE ${whereClause}
        ORDER BY 
          CASE severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          name ASC
      `, ...params);
      
      return rules as any[];
    } catch (error) {
      console.error('Error getting rules:', error);
      return [];
    }
  }

  /**
   * Manage whitelist/blacklist
   */
  async updateList(
    listType: 'whitelist' | 'blacklist',
    category: 'users' | 'domains' | 'ip_addresses' | 'keywords',
    action: 'add' | 'remove',
    items: string[],
    communityId?: string,
    serverId?: string,
    updatedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentConfig = await this.getConfig(communityId, serverId);
      const currentList = currentConfig[listType][category] || [];
      
      let updatedList: string[];
      
      if (action === 'add') {
        updatedList = [...new Set([...currentList, ...items])];
      } else {
        updatedList = currentList.filter(item => !items.includes(item));
      }
      
      // Store updated list
      const listConfig = {
        ...currentConfig[listType],
        [category]: updatedList
      };
      
      await this.storeConfigSetting(listType, listConfig, communityId, serverId, updatedBy);
      
      // Clear cache
      await this.clearConfigCache(communityId, serverId);
      
      // Log the change
      await this.logConfigChange(`${listType}_${action}`, { category, items }, updatedBy, communityId, serverId);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating list:', error);
      return { success: false, error: 'Failed to update list' };
    }
  }

  /**
   * Check if user/content is whitelisted
   */
  async isWhitelisted(
    type: 'user' | 'domain' | 'ip_address',
    value: string,
    communityId?: string,
    serverId?: string
  ): Promise<boolean> {
    try {
      const config = await this.getConfig(communityId, serverId);
      const whitelistKey = type === 'user' ? 'users' : 
                          type === 'domain' ? 'domains' : 'ip_addresses';
      
      return config.whitelist[whitelistKey].includes(value);
    } catch (error) {
      console.error('Error checking whitelist:', error);
      return false;
    }
  }

  /**
   * Check if user/content is blacklisted
   */
  async isBlacklisted(
    type: 'user' | 'domain' | 'ip_address' | 'keyword',
    value: string,
    communityId?: string,
    serverId?: string
  ): Promise<boolean> {
    try {
      const config = await this.getConfig(communityId, serverId);
      const blacklistKey = type === 'user' ? 'users' : 
                          type === 'domain' ? 'domains' : 
                          type === 'ip_address' ? 'ip_addresses' : 'keywords';
      
      if (type === 'keyword') {
        // Check if any blacklisted keyword is contained in the value
        return config.blacklist.keywords.some(keyword => 
          value.toLowerCase().includes(keyword.toLowerCase())
        );
      }
      
      return config.blacklist[blacklistKey].includes(value);
    } catch (error) {
      console.error('Error checking blacklist:', error);
      return false;
    }
  }

  /**
   * Get configuration history/audit log
   */
  async getConfigHistory(
    communityId?: string,
    serverId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const whereConditions = [];
      const params = [];
      let paramIndex = 1;
      
      whereConditions.push(`(community_id IS NULL OR community_id = $${paramIndex++})`);
      params.push(communityId || null);
      
      whereConditions.push(`(server_id IS NULL OR server_id = $${paramIndex++})`);
      params.push(serverId || null);
      
      params.push(limit);
      
      const history = await this.prisma.$queryRawUnsafe(`
        SELECT mcl.*, u.username as updated_by_username
        FROM moderation_config_log mcl
        LEFT JOIN users u ON mcl.updated_by = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY mcl.created_at DESC
        LIMIT $${paramIndex}
      `, ...params);
      
      return history as any[];
    } catch (error) {
      console.error('Error getting config history:', error);
      return [];
    }
  }

  /**
   * Export configuration
   */
  async exportConfig(
    communityId?: string,
    serverId?: string
  ): Promise<{ config: ModerationConfig; metadata: any }> {
    try {
      const config = await this.getConfig(communityId, serverId);
      const rules = await this.getRules(communityId, serverId);
      
      const metadata = {
        exported_at: new Date().toISOString(),
        scope: {
          community_id: communityId,
          server_id: serverId
        },
        rule_count: rules.length,
        version: '1.0'
      };
      
      return {
        config: {
          ...config,
          rules: rules
        } as any,
        metadata
      };
    } catch (error) {
      console.error('Error exporting config:', error);
      throw error;
    }
  }

  /**
   * Import configuration
   */
  async importConfig(
    configData: any,
    communityId?: string,
    serverId?: string,
    importedBy?: string,
    options: {
      overwrite_existing?: boolean;
      merge_rules?: boolean;
    } = {}
  ): Promise<{ success: boolean; imported: any; errors: string[] }> {
    try {
      const imported = {
        thresholds: false,
        rules: 0,
        lists: 0
      };
      const errors: string[] = [];
      
      // Import thresholds
      if (configData.thresholds) {
        try {
          const result = await this.updateThresholds(
            configData.thresholds,
            communityId,
            serverId,
            importedBy
          );
          imported.thresholds = result.success;
          if (!result.success) errors.push(`Thresholds: ${result.error}`);
        } catch (error) {
          errors.push(`Thresholds: ${error}`);
        }
      }
      
      // Import rules
      if (configData.rules && Array.isArray(configData.rules)) {
        for (const rule of configData.rules) {
          try {
            const result = await this.createRule({
              ...rule,
              community_id: communityId,
              server_id: serverId
            }, importedBy);
            
            if (result.success) {
              imported.rules++;
            } else {
              if (options.overwrite_existing && result.error?.includes('already exists')) {
                // Try to update existing rule
                const existingRule = await this.findRuleByName(rule.name, communityId, serverId);
                if (existingRule) {
                  const updateResult = await this.updateRule(existingRule.id, rule, importedBy);
                  if (updateResult.success) {
                    imported.rules++;
                  } else {
                    errors.push(`Rule '${rule.name}': ${updateResult.error}`);
                  }
                }
              } else {
                errors.push(`Rule '${rule.name}': ${result.error}`);
              }
            }
          } catch (error) {
            errors.push(`Rule '${rule.name}': ${error}`);
          }
        }
      }
      
      // Import whitelist/blacklist
      if (configData.whitelist || configData.blacklist) {
        try {
          for (const listType of ['whitelist', 'blacklist'] as const) {
            if (configData[listType]) {
              for (const [category, items] of Object.entries(configData[listType])) {
                if (Array.isArray(items) && items.length > 0) {
                  const result = await this.updateList(
                    listType,
                    category as any,
                    'add',
                    items,
                    communityId,
                    serverId,
                    importedBy
                  );
                  if (result.success) {
                    imported.lists++;
                  } else {
                    errors.push(`${listType} ${category}: ${result.error}`);
                  }
                }
              }
            }
          }
        } catch (error) {
          errors.push(`Lists: ${error}`);
        }
      }
      
      return {
        success: errors.length === 0,
        imported,
        errors
      };
    } catch (error) {
      console.error('Error importing config:', error);
      return {
        success: false,
        imported: { thresholds: false, rules: 0, lists: 0 },
        errors: [`Import failed: ${error}`]
      };
    }
  }

  // Private helper methods
  
  private async buildConfig(
    communityId?: string,
    serverId?: string
  ): Promise<ModerationConfig> {
    try {
      // Get settings from database
      const settings = await this.getConfigSettings(communityId, serverId);
      
      // Build configuration with defaults
      const config: ModerationConfig = {
        thresholds: {
          toxicity: 0.7,
          hate_speech: 0.8,
          harassment: 0.7,
          spam: 0.8,
          nsfw: 0.6,
          violence: 0.8,
          self_harm: 0.5,
          identity_attack: 0.8,
          profanity: 0.7,
          threat: 0.8,
          ...settings.thresholds
        },
        auto_actions: {
          critical_threshold: 0.9,
          high_threshold: 0.8,
          medium_threshold: 0.6,
          low_threshold: 0.4,
          ...settings.auto_actions
        },
        rate_limits: {
          requests_per_minute: 60,
          burst_limit: 10,
          enabled: true,
          ...settings.rate_limits
        },
        openai_config: {
          api_key: process.env.OPENAI_API_KEY || '',
          model: 'gpt-4',
          max_tokens: 500,
          temperature: 0.1,
          ...settings.openai_config
        },
        fallback_enabled: settings.fallback_enabled ?? true,
        cache_duration_minutes: settings.cache_duration_minutes ?? 30,
        notification_settings: {
          notify_on_high_severity: true,
          notify_on_auto_actions: true,
          admin_notification_threshold: 0.8,
          ...settings.notification_settings
        },
        whitelist: {
          users: [],
          domains: [],
          ip_addresses: [],
          ...settings.whitelist
        },
        blacklist: {
          users: [],
          domains: [],
          ip_addresses: [],
          keywords: [],
          ...settings.blacklist
        }
      };
      
      return config;
    } catch (error) {
      console.error('Error building config:', error);
      return this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): ModerationConfig {
    return {
      thresholds: {
        toxicity: 0.7,
        hate_speech: 0.8,
        harassment: 0.7,
        spam: 0.8,
        nsfw: 0.6,
        violence: 0.8,
        self_harm: 0.5,
        identity_attack: 0.8,
        profanity: 0.7,
        threat: 0.8
      },
      auto_actions: {
        critical_threshold: 0.9,
        high_threshold: 0.8,
        medium_threshold: 0.6,
        low_threshold: 0.4
      },
      rate_limits: {
        requests_per_minute: 60,
        burst_limit: 10,
        enabled: true
      },
      openai_config: {
        api_key: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        max_tokens: 500,
        temperature: 0.1
      },
      fallback_enabled: true,
      cache_duration_minutes: 30,
      notification_settings: {
        notify_on_high_severity: true,
        notify_on_auto_actions: true,
        admin_notification_threshold: 0.8
      },
      whitelist: {
        users: [],
        domains: [],
        ip_addresses: []
      },
      blacklist: {
        users: [],
        domains: [],
        ip_addresses: [],
        keywords: []
      }
    };
  }

  private async getConfigSettings(
    communityId?: string,
    serverId?: string
  ): Promise<any> {
    try {
      const settings = await this.prisma.$queryRawUnsafe(`
        SELECT setting_key, setting_value
        FROM moderation_config_settings
        WHERE (community_id IS NULL OR community_id = $1)
        AND (server_id IS NULL OR server_id = $2)
        ORDER BY 
          CASE WHEN community_id IS NULL AND server_id IS NULL THEN 1 ELSE 0 END,
          CASE WHEN community_id IS NOT NULL AND server_id IS NULL THEN 1 ELSE 0 END,
          CASE WHEN community_id IS NULL AND server_id IS NOT NULL THEN 1 ELSE 0 END,
          CASE WHEN community_id IS NOT NULL AND server_id IS NOT NULL THEN 1 ELSE 0 END DESC
      `, communityId || null, serverId || null) as any[];
      
      const config: any = {};
      
      for (const setting of settings) {
        try {
          config[setting.setting_key] = JSON.parse(setting.setting_value);
        } catch {
          config[setting.setting_key] = setting.setting_value;
        }
      }
      
      return config;
    } catch (error) {
      console.error('Error getting config settings:', error);
      return {};
    }
  }

  private async storeConfigSetting(
    key: string,
    value: any,
    communityId?: string,
    serverId?: string,
    updatedBy?: string
  ): Promise<void> {
    try {
      await this.prisma.$queryRawUnsafe(`
        INSERT INTO moderation_config_settings (
          setting_key, setting_value, community_id, server_id, updated_by
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (setting_key, COALESCE(community_id, ''), COALESCE(server_id, ''))
        DO UPDATE SET 
          setting_value = $2,
          updated_by = $5,
          updated_at = NOW()
      `, key, JSON.stringify(value), communityId, serverId, updatedBy);
    } catch (error) {
      console.error('Error storing config setting:', error);
      throw error;
    }
  }

  private async clearConfigCache(communityId?: string, serverId?: string): Promise<void> {
    try {
      const cacheKey = `${this.cache_prefix}${communityId || 'global'}:${serverId || 'global'}`;
      await this.redis.del(cacheKey);
      
      // Also clear any wildcard caches that might be affected
      if (communityId || serverId) {
        await this.redis.del(`${this.cache_prefix}global:global`);
      }
    } catch (error) {
      console.error('Error clearing config cache:', error);
    }
  }

  private async logConfigChange(
    changeType: string,
    changeData: any,
    updatedBy?: string,
    communityId?: string,
    serverId?: string
  ): Promise<void> {
    try {
      await this.prisma.$queryRawUnsafe(`
        INSERT INTO moderation_config_log (
          change_type, change_data, updated_by, community_id, server_id
        ) VALUES ($1, $2, $3, $4, $5)
      `, changeType, JSON.stringify(changeData), updatedBy, communityId, serverId);
    } catch (error) {
      console.error('Error logging config change:', error);
    }
  }

  private async findRuleByName(
    name: string,
    communityId?: string,
    serverId?: string
  ): Promise<any> {
    try {
      const result = await this.prisma.$queryRawUnsafe(`
        SELECT * FROM moderation_rules
        WHERE name = $1
        AND (community_id IS NULL OR community_id = $2)
        AND (server_id IS NULL OR server_id = $3)
        LIMIT 1
      `, name, communityId, serverId);
      
      return (result as any[])[0] || null;
    } catch (error) {
      console.error('Error finding rule by name:', error);
      return null;
    }
  }

  private async getRuleById(ruleId: string): Promise<any> {
    try {
      const result = await this.prisma.$queryRawUnsafe(`
        SELECT * FROM moderation_rules WHERE id = $1
      `, ruleId);
      
      return (result as any[])[0] || null;
    } catch (error) {
      console.error('Error getting rule by ID:', error);
      return null;
    }
  }
}

export const createModerationConfigService = (
  prisma: PrismaClient,
  redis: Redis
): ModerationConfigService => {
  return new ModerationConfigService(prisma, redis);
};