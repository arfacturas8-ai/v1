import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Logger } from 'pino';
import { EventEmitter } from 'events';
import { EnhancedRedisCluster } from './enhanced-redis-cluster';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EmailQueueConfig {
  queueName: string;
  concurrency: number;
  rateLimiting: {
    enabled: boolean;
    maxEmailsPerMinute: number;
    maxEmailsPerHour: number;
    maxEmailsPerDay: number;
    perRecipientLimit: {
      maxPerHour: number;
      maxPerDay: number;
    };
    burstAllowance: number; // Allow short bursts above normal rate
  };
  templates: {
    cacheSize: number;
    cacheTTL: number; // Time to live in milliseconds
    templatesPath: string;
    enablePrecompilation: boolean;
    enableMinification: boolean;
  };
  delivery: {
    providers: EmailProvider[];
    failoverEnabled: boolean;
    loadBalancing: 'round_robin' | 'weighted' | 'priority';
    retryPolicy: {
      attempts: number;
      backoffType: 'fixed' | 'exponential';
      backoffDelay: number;
      maxDelay: number;
    };
  };
  batching: {
    enabled: boolean;
    batchSize: number;
    batchTimeout: number; // Max time to wait for batch to fill
    enablePerRecipientBatching: boolean;
  };
  tracking: {
    enabled: boolean;
    trackOpens: boolean;
    trackClicks: boolean;
    trackUnsubscribes: boolean;
    webhookUrl?: string;
  };
  security: {
    enableDKIM: boolean;
    enableSPF: boolean;
    enableDMARC: boolean;
    requireTLS: boolean;
    contentScanning: boolean;
  };
  analytics: {
    enabled: boolean;
    metricsRetention: number; // Days to retain metrics
    aggregationLevel: 'hour' | 'day' | 'week';
  };
}

export interface EmailProvider {
  name: string;
  type: 'sendgrid' | 'ses' | 'mailgun' | 'postmark' | 'smtp';
  priority: number;
  weight: number; // For weighted load balancing
  enabled: boolean;
  config: {
    apiKey?: string;
    apiSecret?: string;
    region?: string;
    endpoint?: string;
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  limits: {
    maxPerSecond: number;
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    failureThreshold: number;
  };
}

export interface EmailJobData {
  id: string;
  type: 'transactional' | 'marketing' | 'system' | 'notification';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  recipient: {
    email: string;
    name?: string;
    userId?: string;
    segments?: string[];
    preferences?: EmailPreferences;
  };
  sender: {
    email: string;
    name?: string;
    replyTo?: string;
  };
  content: {
    subject: string;
    template?: string;
    templateData?: Record<string, any>;
    html?: string;
    text?: string;
    attachments?: EmailAttachment[];
  };
  scheduling: {
    sendAt?: Date;
    timezone?: string;
    respectOptimalTiming?: boolean;
  };
  tracking: {
    campaignId?: string;
    tags?: string[];
    customProperties?: Record<string, any>;
  };
  options: {
    suppressDuplicates?: boolean;
    suppressUnsubscribed?: boolean;
    bypassRateLimit?: boolean;
    preferredProvider?: string;
  };
}

export interface EmailPreferences {
  optedOut: boolean;
  categories: {
    marketing: boolean;
    transactional: boolean;
    notifications: boolean;
    updates: boolean;
  };
  frequency: {
    maxPerDay: number;
    maxPerWeek: number;
    allowedHours: number[]; // Hours of day (0-23)
    timezone: string;
  };
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  disposition?: 'attachment' | 'inline';
  cid?: string; // For inline images
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
  category: string;
  version: number;
  compiledHtml?: Function;
  compiledText?: Function;
  lastModified: Date;
  cacheKey: string;
}

export interface EmailMetrics {
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  failed: number;
  queued: number;
  processing: number;
  rateLimit: {
    currentMinute: number;
    currentHour: number;
    currentDay: number;
    resetTimes: {
      minute: Date;
      hour: Date;
      day: Date;
    };
  };
  providerStats: {
    [providerName: string]: {
      sent: number;
      failed: number;
      avgLatency: number;
      healthy: boolean;
    };
  };
  templateStats: {
    [templateId: string]: {
      sent: number;
      opened: number;
      clicked: number;
      openRate: number;
      clickRate: number;
    };
  };
}

export interface RateLimitState {
  minute: { count: number; resetAt: Date };
  hour: { count: number; resetAt: Date };
  day: { count: number; resetAt: Date };
  burst: { count: number; resetAt: Date };
  recipients: Map<string, {
    hour: { count: number; resetAt: Date };
    day: { count: number; resetAt: Date };
  }>;
}

/**
 * Optimized Email Queue System
 * 
 * Features:
 * - Advanced rate limiting with burst allowance
 * - Template caching and precompilation
 * - Multi-provider failover and load balancing
 * - Batch processing for high volume
 * - Comprehensive tracking and analytics
 * - Recipient preference management
 * - Security features (DKIM, SPF, DMARC)
 * - Intelligent delivery timing optimization
 */
export class OptimizedEmailQueue extends EventEmitter {
  private queue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;
  private templateCache = new Map<string, EmailTemplate>();
  private rateLimitState: RateLimitState;
  private providerRotation = new Map<string, number>();
  private batchBuffer: EmailJobData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private metrics: EmailMetrics;
  private isShuttingDown = false;
  
  // Rate limiting intervals
  private rateLimitInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  constructor(
    private config: EmailQueueConfig,
    private redisCluster: EnhancedRedisCluster,
    private logger: Logger
  ) {
    super();
    
    // Initialize rate limit state
    this.rateLimitState = {
      minute: { count: 0, resetAt: new Date(Date.now() + 60000) },
      hour: { count: 0, resetAt: new Date(Date.now() + 3600000) },
      day: { count: 0, resetAt: new Date(Date.now() + 86400000) },
      burst: { count: 0, resetAt: new Date(Date.now() + 60000) },
      recipients: new Map()
    };
    
    // Initialize metrics
    this.metrics = {
      sent: 0,
      delivered: 0,
      bounced: 0,
      complained: 0,
      opened: 0,
      clicked: 0,
      unsubscribed: 0,
      failed: 0,
      queued: 0,
      processing: 0,
      rateLimit: {
        currentMinute: 0,
        currentHour: 0,
        currentDay: 0,
        resetTimes: {
          minute: new Date(Date.now() + 60000),
          hour: new Date(Date.now() + 3600000),
          day: new Date(Date.now() + 86400000)
        }
      },
      providerStats: {},
      templateStats: {}
    };
    
    // Initialize provider stats
    this.config.delivery.providers.forEach(provider => {
      this.metrics.providerStats[provider.name] = {
        sent: 0,
        failed: 0,
        avgLatency: 0,
        healthy: true
      };
    });
  }
  
  /**
   * Initialize the email queue system
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing optimized email queue...');
      
      const connection = await this.redisCluster.getConnection();
      
      // Create queue
      this.queue = new Queue(this.config.queueName, {
        connection,
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 500,
          attempts: this.config.delivery.retryPolicy.attempts,
          backoff: {
            type: this.config.delivery.retryPolicy.backoffType,
            delay: this.config.delivery.retryPolicy.backoffDelay
          }
        }
      });
      
      // Create worker
      this.worker = new Worker(
        this.config.queueName,
        async (job: Job<EmailJobData>) => {
          return await this.processEmailJob(job);
        },
        {
          connection,
          concurrency: this.config.concurrency,
          removeOnComplete: 1000,
          removeOnFail: 500
        }
      );
      
      // Create queue events
      this.queueEvents = new QueueEvents(this.config.queueName, {
        connection
      });
      
      this.setupEventListeners();
      
      // Load templates into cache
      await this.loadTemplates();
      
      // Start monitoring intervals
      this.startRateLimitMonitoring();
      this.startMetricsCollection();
      this.startProviderHealthChecks();
      
      this.logger.info(`Optimized email queue initialized: ${this.config.queueName}`);
      
    } catch (error) {
      this.logger.error('Failed to initialize email queue:', error);
      throw error;
    }
  }
  
  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    this.queueEvents.on('completed', (jobId) => {
      this.metrics.sent++;
      this.metrics.processing--;
      this.logger.debug(`Email job completed: ${jobId}`);
    });
    
    this.queueEvents.on('failed', (jobId, err) => {
      this.metrics.failed++;
      this.metrics.processing--;
      this.logger.error(`Email job failed: ${jobId}`, err);
    });
    
    this.queueEvents.on('active', (jobId) => {
      this.metrics.processing++;
      this.metrics.queued--;
    });
    
    this.queueEvents.on('waiting', (jobId) => {
      this.metrics.queued++;
    });
  }
  
  /**
   * Add email job to queue with rate limiting and validation
   */
  async addEmail(emailData: EmailJobData): Promise<Job<EmailJobData> | null> {
    try {
      // Validate email data
      this.validateEmailData(emailData);
      
      // Check recipient preferences
      if (emailData.options?.suppressUnsubscribed && 
          await this.isRecipientUnsubscribed(emailData.recipient.email)) {
        this.logger.info(`Email suppressed - recipient unsubscribed: ${emailData.recipient.email}`);
        return null;
      }
      
      // Check for duplicates
      if (emailData.options?.suppressDuplicates && 
          await this.isDuplicateEmail(emailData)) {
        this.logger.info(`Email suppressed - duplicate detected: ${emailData.id}`);
        return null;
      }
      
      // Apply rate limiting
      if (!emailData.options?.bypassRateLimit && 
          !await this.checkRateLimit(emailData.recipient.email)) {
        // Add to delayed queue if rate limited
        const delay = this.calculateRateLimitDelay();
        emailData.scheduling = emailData.scheduling || {};
        emailData.scheduling.sendAt = new Date(Date.now() + delay);
        
        this.logger.info(`Email rate limited, delayed by ${delay}ms: ${emailData.id}`);
      }
      
      // Determine priority
      const priority = this.mapPriority(emailData.priority);
      
      // Calculate delay for scheduled emails
      let delay = 0;
      if (emailData.scheduling?.sendAt) {
        delay = Math.max(0, emailData.scheduling.sendAt.getTime() - Date.now());
      }
      
      // Add optimal timing if enabled
      if (emailData.scheduling?.respectOptimalTiming) {
        const optimalDelay = await this.calculateOptimalTiming(emailData.recipient);
        delay = Math.max(delay, optimalDelay);
      }
      
      // Handle batching
      if (this.config.batching.enabled && this.shouldBatch(emailData)) {
        return await this.addToBatch(emailData);
      }
      
      // Add to queue
      const job = await this.queue.add(
        `email-${emailData.type}`,
        emailData,
        {
          priority,
          delay,
          jobId: emailData.id,
          removeOnComplete: 100,
          removeOnFail: 50
        }
      );
      
      this.logger.debug(`Email job added: ${emailData.id} (priority: ${priority}, delay: ${delay}ms)`);
      
      // Update rate limit counters
      if (!emailData.options?.bypassRateLimit) {
        await this.updateRateLimitCounters(emailData.recipient.email);
      }
      
      return job;
      
    } catch (error) {
      this.logger.error('Failed to add email job:', error);
      throw error;
    }
  }
  
  /**
   * Process email job
   */
  private async processEmailJob(job: Job<EmailJobData>): Promise<any> {
    const start = Date.now();
    const emailData = job.data;
    
    try {
      this.logger.info(`Processing email: ${emailData.id} to ${emailData.recipient.email}`);
      
      // Render template if specified
      let html = emailData.content.html;
      let text = emailData.content.text;
      let subject = emailData.content.subject;
      
      if (emailData.content.template) {
        const rendered = await this.renderTemplate(
          emailData.content.template,
          emailData.content.templateData || {}
        );
        
        html = rendered.html;
        text = rendered.text;
        subject = rendered.subject;
      }
      
      // Add tracking pixels and links if enabled
      if (this.config.tracking.enabled) {
        html = this.addTrackingPixels(html, emailData);
        html = this.addClickTracking(html, emailData);
      }
      
      // Select provider
      const provider = await this.selectProvider(emailData);
      if (!provider) {
        throw new Error('No healthy email providers available');
      }
      
      // Send email
      const result = await this.sendWithProvider(provider, {
        ...emailData,
        content: {
          ...emailData.content,
          html,
          text,
          subject
        }
      });
      
      // Update metrics
      const latency = Date.now() - start;
      this.updateProviderMetrics(provider.name, true, latency);
      this.updateTemplateMetrics(emailData.content.template, 'sent');
      
      this.logger.info(`Email sent successfully: ${emailData.id} via ${provider.name} in ${latency}ms`);
      
      return {
        success: true,
        provider: provider.name,
        messageId: result.messageId,
        latency
      };
      
    } catch (error) {
      const latency = Date.now() - start;
      
      // Try failover if enabled and error is provider-specific
      if (this.config.delivery.failoverEnabled && this.isProviderError(error)) {
        try {
          const fallbackProvider = await this.selectProvider(emailData, true);
          if (fallbackProvider) {
            const result = await this.sendWithProvider(fallbackProvider, emailData);
            
            this.updateProviderMetrics(fallbackProvider.name, true, latency);
            this.logger.info(`Email sent via failover: ${emailData.id} via ${fallbackProvider.name}`);
            
            return {
              success: true,
              provider: fallbackProvider.name,
              messageId: result.messageId,
              latency,
              failover: true
            };
          }
        } catch (failoverError) {
          this.logger.error('Failover also failed:', failoverError);
        }
      }
      
      // Update failure metrics
      this.updateProviderMetrics('unknown', false, latency);
      
      this.logger.error(`Email job failed: ${emailData.id}`, error);
      throw error;
    }
  }
  
  /**
   * Load email templates into cache
   */
  private async loadTemplates(): Promise<void> {
    try {
      const templatesPath = this.config.templates.templatesPath;
      const templateFiles = await fs.readdir(templatesPath);
      
      for (const file of templateFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(templatesPath, file);
          const templateData = JSON.parse(await fs.readFile(filePath, 'utf8'));
          
          const template: EmailTemplate = {
            id: templateData.id,
            name: templateData.name,
            subject: templateData.subject,
            html: templateData.html,
            text: templateData.text,
            variables: templateData.variables || [],
            category: templateData.category || 'general',
            version: templateData.version || 1,
            lastModified: new Date(templateData.lastModified || Date.now()),
            cacheKey: this.generateCacheKey(templateData.id, templateData.version)
          };
          
          // Precompile templates if enabled
          if (this.config.templates.enablePrecompilation) {
            template.compiledHtml = this.compileTemplate(template.html);
            template.compiledText = this.compileTemplate(template.text);
          }
          
          this.templateCache.set(template.id, template);
          this.logger.debug(`Loaded template: ${template.id}`);
        }
      }
      
      this.logger.info(`Loaded ${this.templateCache.size} email templates`);
      
    } catch (error) {
      this.logger.error('Failed to load email templates:', error);
    }
  }
  
  /**
   * Render email template with data
   */
  private async renderTemplate(
    templateId: string,
    data: Record<string, any>
  ): Promise<{ html: string; text: string; subject: string }> {
    const template = this.templateCache.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Use precompiled templates if available
    if (template.compiledHtml && template.compiledText) {
      return {
        html: template.compiledHtml(data),
        text: template.compiledText(data),
        subject: this.renderString(template.subject, data)
      };
    }
    
    // Fallback to string replacement
    return {
      html: this.renderString(template.html, data),
      text: this.renderString(template.text, data),
      subject: this.renderString(template.subject, data)
    };
  }
  
  /**
   * Simple template compilation (could be replaced with Handlebars, Mustache, etc.)
   */
  private compileTemplate(templateString: string): Function {
    // Simple template compilation - replace with your preferred template engine
    return (data: Record<string, any>) => {
      return templateString.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const value = key.split('.').reduce((obj: any, prop: string) => obj?.[prop], data);
        return value !== undefined ? String(value) : match;
      });
    };
  }
  
  /**
   * Simple string rendering with variable replacement
   */
  private renderString(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const value = key.split('.').reduce((obj: any, prop: string) => obj?.[prop], data);
      return value !== undefined ? String(value) : match;
    });
  }
  
  /**
   * Check rate limits
   */
  private async checkRateLimit(recipientEmail: string): Promise<boolean> {
    if (!this.config.rateLimiting.enabled) return true;
    
    const now = new Date();
    const rateLimiting = this.config.rateLimiting;
    
    // Check global limits
    if (this.rateLimitState.minute.resetAt <= now) {
      this.rateLimitState.minute = {
        count: 0,
        resetAt: new Date(now.getTime() + 60000)
      };
    }
    
    if (this.rateLimitState.hour.resetAt <= now) {
      this.rateLimitState.hour = {
        count: 0,
        resetAt: new Date(now.getTime() + 3600000)
      };
    }
    
    if (this.rateLimitState.day.resetAt <= now) {
      this.rateLimitState.day = {
        count: 0,
        resetAt: new Date(now.getTime() + 86400000)
      };
    }
    
    // Check burst limit
    if (this.rateLimitState.burst.resetAt <= now) {
      this.rateLimitState.burst = {
        count: 0,
        resetAt: new Date(now.getTime() + 60000)
      };
    }
    
    // Check global rate limits
    if (this.rateLimitState.minute.count >= rateLimiting.maxEmailsPerMinute) {
      // Allow burst if under burst allowance
      if (this.rateLimitState.burst.count < rateLimiting.burstAllowance) {
        this.rateLimitState.burst.count++;
        return true;
      }
      return false;
    }
    
    if (this.rateLimitState.hour.count >= rateLimiting.maxEmailsPerHour) {
      return false;
    }
    
    if (this.rateLimitState.day.count >= rateLimiting.maxEmailsPerDay) {
      return false;
    }
    
    // Check per-recipient limits
    const recipientLimits = this.rateLimitState.recipients.get(recipientEmail);
    if (recipientLimits) {
      if (recipientLimits.hour.resetAt <= now) {
        recipientLimits.hour = {
          count: 0,
          resetAt: new Date(now.getTime() + 3600000)
        };
      }
      
      if (recipientLimits.day.resetAt <= now) {
        recipientLimits.day = {
          count: 0,
          resetAt: new Date(now.getTime() + 86400000)
        };
      }
      
      if (recipientLimits.hour.count >= rateLimiting.perRecipientLimit.maxPerHour ||
          recipientLimits.day.count >= rateLimiting.perRecipientLimit.maxPerDay) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Update rate limit counters
   */
  private async updateRateLimitCounters(recipientEmail: string): Promise<void> {
    // Update global counters
    this.rateLimitState.minute.count++;
    this.rateLimitState.hour.count++;
    this.rateLimitState.day.count++;
    
    // Update per-recipient counters
    if (!this.rateLimitState.recipients.has(recipientEmail)) {
      this.rateLimitState.recipients.set(recipientEmail, {
        hour: { count: 0, resetAt: new Date(Date.now() + 3600000) },
        day: { count: 0, resetAt: new Date(Date.now() + 86400000) }
      });
    }
    
    const recipientLimits = this.rateLimitState.recipients.get(recipientEmail)!;
    recipientLimits.hour.count++;
    recipientLimits.day.count++;
  }
  
  /**
   * Calculate delay for rate limited emails
   */
  private calculateRateLimitDelay(): number {
    const now = Date.now();
    const minuteReset = this.rateLimitState.minute.resetAt.getTime();
    const hourReset = this.rateLimitState.hour.resetAt.getTime();
    const dayReset = this.rateLimitState.day.resetAt.getTime();
    
    // Return the shortest delay needed
    return Math.min(
      Math.max(0, minuteReset - now),
      Math.max(0, hourReset - now),
      Math.max(0, dayReset - now)
    );
  }
  
  /**
   * Select best email provider based on configuration
   */
  private async selectProvider(emailData: EmailJobData, isFailover = false): Promise<EmailProvider | null> {
    const availableProviders = this.config.delivery.providers
      .filter(p => p.enabled && this.metrics.providerStats[p.name]?.healthy)
      .sort((a, b) => a.priority - b.priority);
    
    if (availableProviders.length === 0) {
      return null;
    }
    
    // Use preferred provider if specified and healthy
    if (emailData.options?.preferredProvider && !isFailover) {
      const preferred = availableProviders.find(p => p.name === emailData.options?.preferredProvider);
      if (preferred) {
        return preferred;
      }
    }
    
    // Apply load balancing strategy
    switch (this.config.delivery.loadBalancing) {
      case 'round_robin':
        return this.selectRoundRobin(availableProviders);
      case 'weighted':
        return this.selectWeighted(availableProviders);
      case 'priority':
      default:
        return availableProviders[0];
    }
  }
  
  /**
   * Round-robin provider selection
   */
  private selectRoundRobin(providers: EmailProvider[]): EmailProvider {
    const key = 'round_robin';
    const current = this.providerRotation.get(key) || 0;
    const selected = providers[current % providers.length];
    this.providerRotation.set(key, current + 1);
    return selected;
  }
  
  /**
   * Weighted provider selection
   */
  private selectWeighted(providers: EmailProvider[]): EmailProvider {
    const totalWeight = providers.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const provider of providers) {
      random -= provider.weight;
      if (random <= 0) {
        return provider;
      }
    }
    
    return providers[0]; // Fallback
  }
  
  /**
   * Send email with specific provider
   */
  private async sendWithProvider(
    provider: EmailProvider,
    emailData: EmailJobData
  ): Promise<{ messageId: string }> {
    // Implementation would depend on provider type
    // This is a placeholder that simulates sending
    
    const delay = Math.random() * 1000 + 500; // Simulate 0.5-1.5s delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Simulated provider error from ${provider.name}`);
    }
    
    return {
      messageId: `${provider.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  /**
   * Add tracking pixels to HTML content
   */
  private addTrackingPixels(html: string, emailData: EmailJobData): string {
    if (!this.config.tracking.trackOpens) return html;
    
    const trackingPixel = `<img src="https://track.cryb.ai/open/${emailData.id}" width="1" height="1" style="display:none;" alt="" />`;
    
    // Insert tracking pixel before closing body tag
    return html.replace('</body>', `${trackingPixel}</body>`);
  }
  
  /**
   * Add click tracking to links
   */
  private addClickTracking(html: string, emailData: EmailJobData): string {
    if (!this.config.tracking.trackClicks) return html;
    
    // Replace href attributes with tracking URLs
    return html.replace(
      /href=["'](https?:\/\/[^"']+)["']/gi,
      (match, url) => {
        const trackingUrl = `https://track.cryb.ai/click/${emailData.id}?url=${encodeURIComponent(url)}`;
        return `href="${trackingUrl}"`;
      }
    );
  }
  
  /**
   * Check if email is duplicate
   */
  private async isDuplicateEmail(emailData: EmailJobData): Promise<boolean> {
    // Implementation would check Redis for recent similar emails
    // This is a placeholder
    return false;
  }
  
  /**
   * Check if recipient is unsubscribed
   */
  private async isRecipientUnsubscribed(email: string): Promise<boolean> {
    // Implementation would check database for unsubscribe status
    // This is a placeholder
    return false;
  }
  
  /**
   * Calculate optimal timing for email delivery
   */
  private async calculateOptimalTiming(recipient: EmailJobData['recipient']): Promise<number> {
    // Implementation would analyze recipient behavior to determine best send time
    // This is a placeholder that returns random delay
    return Math.random() * 3600000; // 0-1 hour
  }
  
  /**
   * Various utility methods
   */
  private validateEmailData(emailData: EmailJobData): void {
    if (!emailData.recipient.email || !this.isValidEmail(emailData.recipient.email)) {
      throw new Error('Invalid recipient email');
    }
    
    if (!emailData.content.subject) {
      throw new Error('Missing email subject');
    }
    
    if (!emailData.content.html && !emailData.content.text && !emailData.content.template) {
      throw new Error('Missing email content');
    }
  }
  
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  private mapPriority(priority: string): number {
    const map = { urgent: 1, high: 2, normal: 3, low: 4 };
    return map[priority as keyof typeof map] || 3;
  }
  
  private generateCacheKey(templateId: string, version: number): string {
    return crypto.createHash('md5').update(`${templateId}-${version}`).digest('hex');
  }
  
  private shouldBatch(emailData: EmailJobData): boolean {
    return emailData.type === 'marketing' && emailData.priority !== 'urgent';
  }
  
  private async addToBatch(emailData: EmailJobData): Promise<Job<EmailJobData> | null> {
    this.batchBuffer.push(emailData);
    
    if (this.batchBuffer.length >= this.config.batching.batchSize) {
      await this.processBatch();
      return null; // Batch processing doesn't return individual jobs
    }
    
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.config.batching.batchTimeout);
    }
    
    return null;
  }
  
  private async processBatch(): Promise<void> {
    if (this.batchBuffer.length === 0) return;
    
    const batch = [...this.batchBuffer];
    this.batchBuffer = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Process batch emails
    const batchPromises = batch.map(emailData => 
      this.queue.add(`batch-email-${emailData.type}`, emailData)
    );
    
    await Promise.all(batchPromises);
    this.logger.info(`Processed email batch: ${batch.length} emails`);
  }
  
  private isProviderError(error: any): boolean {
    // Determine if error is provider-specific and should trigger failover
    return error.message?.includes('provider') || 
           error.code === 'PROVIDER_ERROR' ||
           error.status >= 500;
  }
  
  private updateProviderMetrics(providerName: string, success: boolean, latency: number): void {
    const stats = this.metrics.providerStats[providerName];
    if (!stats) return;
    
    if (success) {
      stats.sent++;
      stats.avgLatency = (stats.avgLatency + latency) / 2;
    } else {
      stats.failed++;
      stats.healthy = stats.failed / (stats.sent + stats.failed) < 0.1; // 90% success rate threshold
    }
  }
  
  private updateTemplateMetrics(templateId: string | undefined, action: string): void {
    if (!templateId) return;
    
    if (!this.metrics.templateStats[templateId]) {
      this.metrics.templateStats[templateId] = {
        sent: 0,
        opened: 0,
        clicked: 0,
        openRate: 0,
        clickRate: 0
      };
    }
    
    const stats = this.metrics.templateStats[templateId];
    
    switch (action) {
      case 'sent':
        stats.sent++;
        break;
      case 'opened':
        stats.opened++;
        stats.openRate = stats.sent > 0 ? stats.opened / stats.sent : 0;
        break;
      case 'clicked':
        stats.clicked++;
        stats.clickRate = stats.sent > 0 ? stats.clicked / stats.sent : 0;
        break;
    }
  }
  
  /**
   * Start monitoring intervals
   */
  private startRateLimitMonitoring(): void {
    this.rateLimitInterval = setInterval(() => {
      this.updateMetricsFromRateLimit();
    }, 60000); // Every minute
  }
  
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, 300000); // Every 5 minutes
  }
  
  private startProviderHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performProviderHealthChecks();
    }, 300000); // Every 5 minutes
  }
  
  private updateMetricsFromRateLimit(): void {
    this.metrics.rateLimit = {
      currentMinute: this.rateLimitState.minute.count,
      currentHour: this.rateLimitState.hour.count,
      currentDay: this.rateLimitState.day.count,
      resetTimes: {
        minute: this.rateLimitState.minute.resetAt,
        hour: this.rateLimitState.hour.resetAt,
        day: this.rateLimitState.day.resetAt
      }
    };
  }
  
  private async collectMetrics(): Promise<void> {
    try {
      const counts = await this.queue.getJobCounts('waiting', 'active', 'completed', 'failed');
      
      this.metrics.queued = counts.waiting;
      this.metrics.processing = counts.active;
      
      this.emit('metricsUpdated', this.metrics);
    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
    }
  }
  
  private async performProviderHealthChecks(): Promise<void> {
    for (const provider of this.config.delivery.providers) {
      if (!provider.enabled || !provider.healthCheck.enabled) continue;
      
      try {
        // Perform actual health check (placeholder)
        const isHealthy = Math.random() > 0.05; // 95% healthy simulation
        
        this.metrics.providerStats[provider.name].healthy = isHealthy;
        
        if (!isHealthy) {
          this.logger.warn(`Provider health check failed: ${provider.name}`);
          this.emit('providerUnhealthy', provider.name);
        }
      } catch (error) {
        this.metrics.providerStats[provider.name].healthy = false;
        this.logger.error(`Provider health check error: ${provider.name}`, error);
      }
    }
  }
  
  /**
   * Public API methods
   */
  
  /**
   * Get current metrics
   */
  getMetrics(): EmailMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    return await this.queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  }
  
  /**
   * Refresh template cache
   */
  async refreshTemplates(): Promise<void> {
    this.templateCache.clear();
    await this.loadTemplates();
    this.logger.info('Template cache refreshed');
  }
  
  /**
   * Clear rate limits (admin function)
   */
  clearRateLimits(): void {
    const now = Date.now();
    this.rateLimitState = {
      minute: { count: 0, resetAt: new Date(now + 60000) },
      hour: { count: 0, resetAt: new Date(now + 3600000) },
      day: { count: 0, resetAt: new Date(now + 86400000) },
      burst: { count: 0, resetAt: new Date(now + 60000) },
      recipients: new Map()
    };
    
    this.logger.info('Rate limits cleared');
  }
  
  /**
   * Pause/resume queue
   */
  async pauseQueue(): Promise<void> {
    await this.queue.pause();
    this.logger.info('Email queue paused');
  }
  
  async resumeQueue(): Promise<void> {
    await this.queue.resume();
    this.logger.info('Email queue resumed');
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    this.logger.info('Shutting down email queue...');
    
    // Process any remaining batch
    if (this.batchBuffer.length > 0) {
      await this.processBatch();
    }
    
    // Stop intervals
    if (this.rateLimitInterval) clearInterval(this.rateLimitInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.batchTimer) clearTimeout(this.batchTimer);
    
    // Close queue components
    await Promise.all([
      this.worker.close(),
      this.queueEvents.close(),
      this.queue.close()
    ]);
    
    this.logger.info('Email queue shutdown completed');
  }
}
