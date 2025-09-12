import { Job } from 'bullmq';
import sgMail, { MailDataRequired, ResponseError } from '@sendgrid/mail';
import { Logger } from 'pino';

export interface EmailJobData {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  template?: {
    id: string;
    data: Record<string, any>;
  };
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
  metadata?: {
    userId?: string;
    campaignId?: string;
    type: 'welcome' | 'notification' | 'marketing' | 'transactional' | 'system';
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
  tracking?: {
    trackClicks: boolean;
    trackOpens: boolean;
    subscriptionTracking?: boolean;
  };
  scheduling?: {
    sendAt: Date;
    timezone?: string;
  };
}

export interface EmailDeliveryResult {
  messageId: string;
  status: 'sent' | 'failed' | 'deferred' | 'bounced';
  response?: any;
  error?: string;
  timestamp: Date;
  retryCount?: number;
  deliveryAttempts: number;
}

export class EmailWorker {
  private defaultFrom: string;
  private isInitialized = false;
  private deliveryTracking: Map<string, EmailDeliveryResult> = new Map();
  private rateLimiter: {
    requests: number[];
    windowMs: number;
    maxRequests: number;
  } = {
    requests: [],
    windowMs: 60000, // 1 minute
    maxRequests: 100 // SendGrid free tier allows 100/day
  };

  constructor(
    private logger: Logger,
    private config: {
      apiKey: string;
      defaultFrom: string;
      templates?: Record<string, string>;
      webhookUrl?: string;
      rateLimiting?: {
        maxPerMinute: number;
        maxPerDay: number;
      };
    }
  ) {
    this.defaultFrom = config.defaultFrom;
    this.initialize();
  }

  private initialize(): void {
    try {
      if (!this.config.apiKey) {
        throw new Error('SendGrid API key is required');
      }

      sgMail.setApiKey(this.config.apiKey);
      
      // Configure rate limiting if provided
      if (this.config.rateLimiting?.maxPerMinute) {
        this.rateLimiter.maxRequests = this.config.rateLimiting.maxPerMinute;
      }

      this.isInitialized = true;
      this.logger.info('Email worker initialized successfully', {
        defaultFrom: this.defaultFrom,
        rateLimitPerMinute: this.rateLimiter.maxRequests
      });
    } catch (error) {
      this.logger.error('Failed to initialize email worker:', error);
      throw error;
    }
  }

  async processJob(job: Job<EmailJobData>): Promise<EmailDeliveryResult> {
    if (!this.isInitialized) {
      throw new Error('Email worker not initialized');
    }

    const startTime = Date.now();
    const jobId = job.id || 'unknown';

    try {
      this.logger.info(`Processing email job ${jobId}`, {
        to: Array.isArray(job.data.to) ? job.data.to.length + ' recipients' : job.data.to,
        subject: job.data.subject,
        type: job.data.metadata?.type,
        priority: job.data.metadata?.priority
      });

      // Check rate limiting
      await this.checkRateLimit();

      // Validate email data
      this.validateEmailData(job.data);

      // Prepare email message
      const emailMessage = this.prepareEmailMessage(job.data);

      // Update job progress
      await job.updateProgress(25);

      // Check for scheduling
      if (job.data.scheduling?.sendAt) {
        const sendTime = new Date(job.data.scheduling.sendAt);
        if (sendTime > new Date()) {
          this.logger.info(`Email scheduled for ${sendTime.toISOString()}`);
          await job.updateProgress(50);
          // In production, you might want to reschedule the job
          await new Promise(resolve => setTimeout(resolve, sendTime.getTime() - Date.now()));
        }
      }

      await job.updateProgress(50);

      // Send email using SendGrid
      const response = await this.sendEmailWithSendGrid(emailMessage, jobId);

      await job.updateProgress(75);

      // Process response and create delivery result
      const deliveryResult: EmailDeliveryResult = {
        messageId: response.messageId || jobId,
        status: 'sent',
        response: response,
        timestamp: new Date(),
        deliveryAttempts: (job.attemptsMade || 0) + 1
      };

      // Store delivery tracking
      this.deliveryTracking.set(deliveryResult.messageId, deliveryResult);

      await job.updateProgress(100);

      const processingTime = Date.now() - startTime;
      this.logger.info(`Email sent successfully ${jobId}`, {
        messageId: deliveryResult.messageId,
        processingTime,
        attempts: deliveryResult.deliveryAttempts
      });

      return deliveryResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const deliveryResult: EmailDeliveryResult = {
        messageId: jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        deliveryAttempts: (job.attemptsMade || 0) + 1
      };

      this.deliveryTracking.set(deliveryResult.messageId, deliveryResult);

      this.logger.error(`Email sending failed ${jobId}:`, {
        error: error instanceof Error ? error.message : error,
        processingTime,
        attempts: deliveryResult.deliveryAttempts,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Determine if this is a retryable error
      if (this.isRetryableError(error)) {
        this.logger.info(`Marking email job ${jobId} for retry`);
        throw error; // Let BullMQ handle the retry
      } else {
        this.logger.warn(`Email job ${jobId} failed permanently`);
        deliveryResult.status = 'bounced';
        return deliveryResult;
      }
    }
  }

  private validateEmailData(data: EmailJobData): void {
    if (!data.to || (Array.isArray(data.to) && data.to.length === 0)) {
      throw new Error('Email recipient(s) required');
    }

    if (!data.subject) {
      throw new Error('Email subject required');
    }

    if (!data.text && !data.html && !data.template) {
      throw new Error('Email content (text, html, or template) required');
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.isArray(data.to) ? data.to : [data.to];
    
    for (const recipient of recipients) {
      if (!emailRegex.test(recipient)) {
        throw new Error(`Invalid email address: ${recipient}`);
      }
    }
  }

  private prepareEmailMessage(data: EmailJobData): MailDataRequired {
    const message: MailDataRequired = {
      to: data.to,
      from: data.from || this.defaultFrom,
      subject: data.subject
    };

    // Add content
    if (data.template) {
      message.templateId = data.template.id;
      message.dynamicTemplateData = data.template.data;
    } else {
      if (data.text) message.text = data.text;
      if (data.html) message.html = data.html;
    }

    // Add attachments
    if (data.attachments) {
      message.attachments = data.attachments.map(attachment => ({
        content: attachment.content,
        filename: attachment.filename,
        type: attachment.type,
        disposition: attachment.disposition || 'attachment'
      }));
    }

    // Add tracking settings
    if (data.tracking) {
      message.trackingSettings = {
        clickTracking: {
          enable: data.tracking.trackClicks
        },
        openTracking: {
          enable: data.tracking.trackOpens
        },
        subscriptionTracking: {
          enable: data.tracking.subscriptionTracking || false
        }
      };
    }

    // Add custom headers for metadata
    if (data.metadata) {
      message.headers = {
        'X-CRYB-User-ID': data.metadata.userId || '',
        'X-CRYB-Campaign-ID': data.metadata.campaignId || '',
        'X-CRYB-Email-Type': data.metadata.type,
        'X-CRYB-Priority': data.metadata.priority
      };
    }

    return message;
  }

  private async sendEmailWithSendGrid(message: MailDataRequired, jobId: string): Promise<any> {
    try {
      const response = await sgMail.send(message);
      
      return {
        messageId: response[0]?.headers?.['x-message-id'] || jobId,
        statusCode: response[0]?.statusCode,
        body: response[0]?.body,
        headers: response[0]?.headers
      };
    } catch (error) {
      // Handle SendGrid specific errors
      if (error instanceof Error && 'response' in error) {
        const sendGridError = error as ResponseError;
        
        this.logger.error('SendGrid API error:', {
          statusCode: sendGridError.code,
          message: sendGridError.message,
          response: sendGridError.response?.body
        });

        // Add more context to the error
        const enhancedError = new Error(`SendGrid Error (${sendGridError.code}): ${sendGridError.message}`);
        (enhancedError as any).code = sendGridError.code;
        (enhancedError as any).response = sendGridError.response?.body;
        
        throw enhancedError;
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Network errors and temporary failures should be retried
    const retryableCodes = [
      408, // Request Timeout
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504  // Gateway Timeout
    ];

    if (error.code && retryableCodes.includes(error.code)) {
      return true;
    }

    // Check for network-related errors
    const retryableMessages = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'timeout',
      'network'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.rateLimiter.windowMs;

    // Remove old requests outside the window
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      timestamp => timestamp > windowStart
    );

    // Check if we're at the limit
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
      const oldestRequest = Math.min(...this.rateLimiter.requests);
      const waitTime = oldestRequest + this.rateLimiter.windowMs - now;
      
      this.logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record this request
    this.rateLimiter.requests.push(now);
  }

  // Public methods for monitoring and management

  getDeliveryStatus(messageId: string): EmailDeliveryResult | null {
    return this.deliveryTracking.get(messageId) || null;
  }

  getDeliveryStats(): {
    sent: number;
    failed: number;
    bounced: number;
    deferred: number;
    totalAttempts: number;
  } {
    const results = Array.from(this.deliveryTracking.values());
    
    return {
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      bounced: results.filter(r => r.status === 'bounced').length,
      deferred: results.filter(r => r.status === 'deferred').length,
      totalAttempts: results.reduce((sum, r) => sum + r.deliveryAttempts, 0)
    };
  }

  clearOldDeliveryTracking(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    let cleared = 0;

    for (const [messageId, result] of this.deliveryTracking.entries()) {
      if (result.timestamp.getTime() < cutoff) {
        this.deliveryTracking.delete(messageId);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.logger.info(`Cleared ${cleared} old delivery tracking records`);
    }

    return cleared;
  }

  // Webhook handler for delivery events (if configured)
  handleWebhookEvent(event: any): void {
    try {
      const messageId = event.sg_message_id || event['x-message-id'];
      if (!messageId) return;

      const existingResult = this.deliveryTracking.get(messageId);
      if (!existingResult) return;

      // Update delivery status based on webhook event
      switch (event.event) {
        case 'delivered':
          existingResult.status = 'sent';
          break;
        case 'bounce':
        case 'blocked':
          existingResult.status = 'bounced';
          break;
        case 'deferred':
          existingResult.status = 'deferred';
          break;
        default:
          return;
      }

      existingResult.timestamp = new Date();
      this.deliveryTracking.set(messageId, existingResult);

      this.logger.info(`Updated delivery status via webhook`, {
        messageId,
        status: existingResult.status,
        event: event.event
      });
    } catch (error) {
      this.logger.error('Error handling webhook event:', error);
    }
  }
}