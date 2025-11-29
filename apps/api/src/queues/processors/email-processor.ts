import { Job } from 'bullmq';
import nodemailer, { Transporter } from 'nodemailer';
import { Logger } from 'pino';
import { createGenericPool, Pool } from 'generic-pool';
import { Redis } from 'ioredis';

export interface EmailJobData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  template?: string;
  templateData?: Record<string, any>;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
  priority: 'high' | 'normal' | 'low';
  userId?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables?: string[];
}

export interface EmailDeliveryResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
  envelope: {
    from: string;
    to: string[];
  };
  deliveryTime: number;
  provider: string;
}

export class EmailProcessor {
  private transporters: Map<string, Transporter> = new Map();
  private transporterPool: Pool<Transporter>;
  private templates: Map<string, EmailTemplate> = new Map();
  private redis: Redis;
  private logger: Logger;
  
  private metrics = {
    emailsSent: 0,
    emailsFailed: 0,
    totalDeliveryTime: 0,
    providerStats: new Map<string, { sent: number; failed: number }>(),
  };

  constructor(redis: Redis, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
    this.initializeTransporters();
    this.initializeTransporterPool();
    this.loadEmailTemplates();
  }

  private initializeTransporters(): void {
    // Primary SMTP transporter
    if (process.env.SMTP_HOST) {
      const primaryTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        pool: true,
        maxConnections: 10,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 10,
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      });

      this.transporters.set('primary', primaryTransporter);
    }

    // SendGrid transporter
    if (process.env.SENDGRID_API_KEY) {
      const sendgridTransporter = nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 50,
      });

      this.transporters.set('sendgrid', sendgridTransporter);
    }

    // AWS SES transporter
    if (process.env.AWS_SES_REGION) {
      const sesTransporter = nodemailer.createTransporter({
        SES: {
          region: process.env.AWS_SES_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        pool: true,
        maxConnections: 10,
        maxMessages: 100,
      });

      this.transporters.set('ses', sesTransporter);
    }

    // Mailgun transporter
    if (process.env.MAILGUN_API_KEY) {
      const mailgunTransporter = nodemailer.createTransporter({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USERNAME || 'api',
          pass: process.env.MAILGUN_API_KEY,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 50,
      });

      this.transporters.set('mailgun', mailgunTransporter);
    }
  }

  private initializeTransporterPool(): void {
    const transporterArray = Array.from(this.transporters.values());
    
    this.transporterPool = createGenericPool({
      create: async () => {
        // Round-robin selection or use load balancing logic
        const transporter = transporterArray[Math.floor(Math.random() * transporterArray.length)];
        return transporter;
      },
      destroy: async (transporter) => {
        // Transporters are reused, so we don't actually destroy them
        return Promise.resolve();
      },
      validate: async (transporter) => {
        try {
          await transporter.verify();
          return true;
        } catch {
          return false;
        }
      },
    }, {
      max: 20,
      min: 5,
      acquireTimeoutMillis: 5000,
      idleTimeoutMillis: 300000,
      autostart: true,
    });
  }

  private async loadEmailTemplates(): Promise<void> {
    try {
      // Load templates from Redis cache or database
      const templateKeys = await this.redis.keys('email:template:*');
      
      for (const key of templateKeys) {
        const templateData = await this.redis.get(key);
        if (templateData) {
          const template = JSON.parse(templateData) as EmailTemplate;
          this.templates.set(template.id, template);
        }
      }

      // Load default templates if none exist
      if (this.templates.size === 0) {
        await this.loadDefaultTemplates();
      }

      this.logger.info({ templateCount: this.templates.size }, 'Email templates loaded');
    } catch (error) {
      this.logger.error({ error }, 'Failed to load email templates');
    }
  }

  private async loadDefaultTemplates(): Promise<void> {
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to CRYB Platform! 🎉',
        html: `
          <h1>Welcome to CRYB, {{username}}!</h1>
          <p>We're excited to have you join our community.</p>
          <p>Get started by:</p>
          <ul>
            <li>Completing your profile</li>
            <li>Joining your first community</li>
            <li>Connecting with friends</li>
          </ul>
          <a href="{{platformUrl}}/onboarding" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Started</a>
        `,
        text: 'Welcome to CRYB, {{username}}! Get started at {{platformUrl}}/onboarding',
        variables: ['username', 'platformUrl'],
      },
      {
        id: 'password-reset',
        name: 'Password Reset',
        subject: 'Reset your CRYB password',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi {{username}},</p>
          <p>You requested a password reset for your CRYB account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="{{resetUrl}}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
        text: 'Reset your password at: {{resetUrl}}',
        variables: ['username', 'resetUrl'],
      },
      {
        id: 'notification-digest',
        name: 'Notification Digest',
        subject: 'Your CRYB notifications digest',
        html: `
          <h1>Your notifications from CRYB</h1>
          <p>Hi {{username}},</p>
          <p>Here's what happened while you were away:</p>
          {{#notifications}}
          <div style="border: 1px solid #e5e7eb; padding: 16px; margin: 8px 0; border-radius: 6px;">
            <strong>{{title}}</strong>
            <p>{{message}}</p>
            <small>{{timestamp}}</small>
          </div>
          {{/notifications}}
          <a href="{{platformUrl}}/notifications">View all notifications</a>
        `,
        text: 'You have {{notificationCount}} new notifications. View them at {{platformUrl}}/notifications',
        variables: ['username', 'notifications', 'notificationCount', 'platformUrl'],
      },
      {
        id: 'email-verification',
        name: 'Email Verification',
        subject: 'Verify your CRYB email address',
        html: `
          <h1>Verify your email address</h1>
          <p>Hi {{username}},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="{{verificationUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `,
        text: 'Verify your email at: {{verificationUrl}}',
        variables: ['username', 'verificationUrl'],
      },
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
      await this.redis.set(
        `email:template:${template.id}`,
        JSON.stringify(template),
        'EX',
        86400 // 24 hours
      );
    }
  }

  public async processEmailJob(job: Job<EmailJobData>): Promise<EmailDeliveryResult> {
    const startTime = Date.now();
    const jobData = job.data;

    try {
      this.logger.info({ jobId: job.id, to: jobData.to }, 'Processing email job');

      // Rate limiting check
      await this.checkRateLimit(jobData);

      // Prepare email content
      const emailContent = await this.prepareEmailContent(jobData);

      // Get transporter from pool
      const transporter = await this.transporterPool.acquire();
      let providerName = 'unknown';

      try {
        // Determine provider name
        providerName = this.getProviderName(transporter);

        // Send email
        const result = await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@cryb.ai',
          to: jobData.to,
          cc: jobData.cc,
          bcc: jobData.bcc,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          attachments: jobData.attachments,
          headers: {
            'X-Priority': this.getPriorityHeader(jobData.priority),
            'X-CRYB-Job-ID': job.id,
            'X-CRYB-User-ID': jobData.userId || 'anonymous',
            ...(jobData.trackOpens && { 'X-Track-Opens': 'true' }),
            ...(jobData.trackClicks && { 'X-Track-Clicks': 'true' }),
          },
        });

        const deliveryTime = Date.now() - startTime;
        
        // Update metrics
        this.metrics.emailsSent++;
        this.metrics.totalDeliveryTime += deliveryTime;
        this.updateProviderStats(providerName, 'sent');

        // Store delivery tracking info
        if (jobData.trackOpens || jobData.trackClicks) {
          await this.storeDeliveryTracking(job.id!, result.messageId, jobData);
        }

        // Log success
        this.logger.info({
          jobId: job.id,
          messageId: result.messageId,
          deliveryTime,
          provider: providerName,
          to: jobData.to,
        }, 'Email sent successfully');

        return {
          messageId: result.messageId,
          accepted: result.accepted as string[],
          rejected: result.rejected as string[],
          pending: result.pending as string[],
          response: result.response,
          envelope: result.envelope,
          deliveryTime,
          provider: providerName,
        };

      } finally {
        await this.transporterPool.release(transporter);
      }

    } catch (error) {
      this.metrics.emailsFailed++;
      this.updateProviderStats(providerName, 'failed');

      this.logger.error({
        error,
        jobId: job.id,
        to: jobData.to,
        provider: providerName,
      }, 'Failed to send email');

      throw error;
    }
  }

  private async prepareEmailContent(jobData: EmailJobData): Promise<{ subject: string; html: string; text: string }> {
    if (jobData.template && jobData.templateData) {
      const template = this.templates.get(jobData.template);
      if (!template) {
        throw new Error(`Email template '${jobData.template}' not found`);
      }

      return {
        subject: this.renderTemplate(template.subject, jobData.templateData),
        html: this.renderTemplate(template.html, jobData.templateData),
        text: this.renderTemplate(template.text || '', jobData.templateData),
      };
    }

    return {
      subject: jobData.subject,
      html: jobData.html || '',
      text: jobData.text || '',
    };
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;

    // Simple template rendering (replace {{variable}} with data.variable)
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    // Handle arrays for iteration (simplified Handlebars-like syntax)
    const arrayRegex = /{{#(\w+)}}([\s\S]*?){{\/\1}}/g;
    rendered = rendered.replace(arrayRegex, (match, arrayName, content) => {
      const arrayData = data[arrayName];
      if (Array.isArray(arrayData)) {
        return arrayData.map(item => {
          let itemContent = content;
          Object.entries(item).forEach(([itemKey, itemValue]) => {
            const itemRegex = new RegExp(`{{${itemKey}}}`, 'g');
            itemContent = itemContent.replace(itemRegex, String(itemValue));
          });
          return itemContent;
        }).join('');
      }
      return '';
    });

    return rendered;
  }

  private async checkRateLimit(jobData: EmailJobData): Promise<void> {
    if (!jobData.userId) return;

    const key = `email:rate_limit:${jobData.userId}`;
    const limit = this.getRateLimit(jobData.priority);
    const window = 3600; // 1 hour

    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, window);
    }

    if (current > limit) {
      throw new Error(`Email rate limit exceeded for user ${jobData.userId}`);
    }
  }

  private getRateLimit(priority: string): number {
    switch (priority) {
      case 'high': return 100;
      case 'normal': return 50;
      case 'low': return 20;
      default: return 50;
    }
  }

  private getPriorityHeader(priority: string): string {
    switch (priority) {
      case 'high': return '1 (Highest)';
      case 'normal': return '3 (Normal)';
      case 'low': return '5 (Lowest)';
      default: return '3 (Normal)';
    }
  }

  private getProviderName(transporter: Transporter): string {
    // This is a simplified way to identify the provider
    // In a real implementation, you'd want a more robust method
    const config = (transporter as any).options;
    
    if (config.service === 'SendGrid') return 'sendgrid';
    if (config.SES) return 'ses';
    if (config.service === 'Mailgun') return 'mailgun';
    if (config.host) return config.host;
    
    return 'unknown';
  }

  private updateProviderStats(provider: string, type: 'sent' | 'failed'): void {
    const stats = this.metrics.providerStats.get(provider) || { sent: 0, failed: 0 };
    stats[type]++;
    this.metrics.providerStats.set(provider, stats);
  }

  private async storeDeliveryTracking(
    jobId: string,
    messageId: string,
    jobData: EmailJobData
  ): Promise<void> {
    const trackingData = {
      jobId,
      messageId,
      userId: jobData.userId,
      to: jobData.to,
      subject: jobData.subject,
      template: jobData.template,
      trackOpens: jobData.trackOpens,
      trackClicks: jobData.trackClicks,
      tags: jobData.tags,
      metadata: jobData.metadata,
      sentAt: new Date().toISOString(),
    };

    await this.redis.set(
      `email:tracking:${messageId}`,
      JSON.stringify(trackingData),
      'EX',
      2592000 // 30 days
    );
  }

  public getMetrics(): any {
    return {
      ...this.metrics,
      averageDeliveryTime: this.metrics.emailsSent > 0 
        ? this.metrics.totalDeliveryTime / this.metrics.emailsSent 
        : 0,
      successRate: this.metrics.emailsSent + this.metrics.emailsFailed > 0
        ? (this.metrics.emailsSent / (this.metrics.emailsSent + this.metrics.emailsFailed)) * 100
        : 100,
      providerStats: Object.fromEntries(this.metrics.providerStats),
      templatesLoaded: this.templates.size,
    };
  }

  public async addTemplate(template: EmailTemplate): Promise<void> {
    this.templates.set(template.id, template);
    await this.redis.set(
      `email:template:${template.id}`,
      JSON.stringify(template),
      'EX',
      86400 // 24 hours
    );
    
    this.logger.info({ templateId: template.id }, 'Email template added');
  }

  public async removeTemplate(templateId: string): Promise<void> {
    this.templates.delete(templateId);
    await this.redis.del(`email:template:${templateId}`);
    
    this.logger.info({ templateId }, 'Email template removed');
  }

  public getTemplate(templateId: string): EmailTemplate | undefined {
    return this.templates.get(templateId);
  }

  public listTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }
}

export default EmailProcessor;