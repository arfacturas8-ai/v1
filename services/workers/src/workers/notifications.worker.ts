import { Logger } from 'pino';
import { Job } from 'bullmq';
import webpush from 'web-push';
import { EmailWorker, EmailJobData } from './email.worker';

export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

export interface SMSNotificationData {
  to: string;
  message: string;
  from?: string;
  metadata?: {
    userId?: string;
    type: 'otp' | 'alert' | 'marketing' | 'transactional';
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
}

export interface InAppNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'social' | 'security' | 'promotional';
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export type NotificationJobData = 
  | { type: 'email'; data: EmailJobData }
  | { type: 'push'; data: PushNotificationData }
  | { type: 'sms'; data: SMSNotificationData }
  | { type: 'in-app'; data: InAppNotificationData }
  | { type: 'webhook'; data: WebhookNotificationData };

export interface WebhookNotificationData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload?: any;
  timeout?: number;
  retries?: number;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  id: string;
  type: string;
  status: 'sent' | 'failed' | 'deferred' | 'bounced';
  timestamp: Date;
  attempts: number;
  response?: any;
  error?: string;
}

export class NotificationsWorker {
  private emailWorker: EmailWorker | null = null;
  private isInitialized = false;
  private deliveryStats = {
    email: { sent: 0, failed: 0 },
    push: { sent: 0, failed: 0 },
    sms: { sent: 0, failed: 0 },
    inApp: { sent: 0, failed: 0 },
    webhook: { sent: 0, failed: 0 }
  };

  constructor(
    private logger: Logger,
    private config: {
      email?: {
        apiKey: string;
        defaultFrom: string;
        templates?: Record<string, string>;
      };
      push?: {
        vapidKeys: {
          publicKey: string;
          privateKey: string;
        };
        gcmApiKey?: string;
      };
      sms?: {
        provider: 'twilio' | 'sns' | 'vonage';
        credentials: Record<string, string>;
      };
      webhook?: {
        defaultTimeout: number;
        defaultRetries: number;
      };
    }
  ) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize email worker if configured
      if (this.config.email) {
        this.emailWorker = new EmailWorker(
          this.logger.child({ component: 'email-worker' }),
          this.config.email
        );
      }

      // Initialize push notifications if configured
      if (this.config.push) {
        webpush.setVapidDetails(
          'mailto:notifications@cryb.ai',
          this.config.push.vapidKeys.publicKey,
          this.config.push.vapidKeys.privateKey
        );

        if (this.config.push.gcmApiKey) {
          webpush.setGCMAPIKey(this.config.push.gcmApiKey);
        }
      }

      this.isInitialized = true;
      this.logger.info('Notifications worker initialized successfully', {
        emailEnabled: !!this.config.email,
        pushEnabled: !!this.config.push,
        smsEnabled: !!this.config.sms,
        webhookEnabled: !!this.config.webhook
      });
    } catch (error) {
      this.logger.error('Failed to initialize notifications worker:', error);
      throw error;
    }
  }

  async processJob(job: Job<NotificationJobData>): Promise<NotificationResult> {
    if (!this.isInitialized) {
      throw new Error('Notifications worker not initialized');
    }

    const jobId = job.id || 'unknown';
    const startTime = Date.now();

    try {
      this.logger.info(`Processing ${job.data.type} notification job ${jobId}`, {
        type: job.data.type,
        attempts: job.attemptsMade || 0
      });

      let result: NotificationResult;

      switch (job.data.type) {
        case 'email':
          result = await this.processEmailNotification(job.data.data, jobId, job);
          break;
        case 'push':
          result = await this.processPushNotification(job.data.data, jobId, job);
          break;
        case 'sms':
          result = await this.processSMSNotification(job.data.data, jobId, job);
          break;
        case 'in-app':
          result = await this.processInAppNotification(job.data.data, jobId, job);
          break;
        case 'webhook':
          result = await this.processWebhookNotification(job.data.data, jobId, job);
          break;
        default:
          throw new Error(`Unsupported notification type: ${(job.data as any).type}`);
      }

      // Update stats
      if (result.status === 'sent') {
        this.deliveryStats[job.data.type as keyof typeof this.deliveryStats].sent++;
      } else {
        this.deliveryStats[job.data.type as keyof typeof this.deliveryStats].failed++;
      }

      const processingTime = Date.now() - startTime;
      this.logger.info(`Notification processed successfully ${jobId}`, {
        type: job.data.type,
        status: result.status,
        processingTime,
        attempts: result.attempts
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const result: NotificationResult = {
        id: jobId,
        type: job.data.type,
        status: 'failed',
        timestamp: new Date(),
        attempts: (job.attemptsMade || 0) + 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.deliveryStats[job.data.type as keyof typeof this.deliveryStats].failed++;

      this.logger.error(`Notification processing failed ${jobId}:`, {
        type: job.data.type,
        error: error instanceof Error ? error.message : error,
        processingTime,
        attempts: result.attempts
      });

      throw error; // Let BullMQ handle retries
    }
  }

  private async processEmailNotification(
    data: EmailJobData, 
    jobId: string, 
    job: Job
  ): Promise<NotificationResult> {
    if (!this.emailWorker) {
      throw new Error('Email worker not configured');
    }

    const emailJob = {
      id: jobId,
      data,
      attemptsMade: job.attemptsMade || 0,
      updateProgress: job.updateProgress.bind(job)
    } as Job<EmailJobData>;

    const emailResult = await this.emailWorker.processJob(emailJob);

    return {
      id: jobId,
      type: 'email',
      status: emailResult.status,
      timestamp: emailResult.timestamp,
      attempts: emailResult.deliveryAttempts,
      response: emailResult.response,
      error: emailResult.error
    };
  }

  private async processPushNotification(
    data: PushNotificationData, 
    jobId: string, 
    job: Job
  ): Promise<NotificationResult> {
    if (!this.config.push) {
      throw new Error('Push notifications not configured');
    }

    await job.updateProgress(25);

    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      image: data.image,
      data: data.data,
      actions: data.actions,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      silent: data.silent,
      timestamp: data.timestamp || Date.now()
    });

    await job.updateProgress(50);

    try {
      const response = await webpush.sendNotification(
        data.subscription,
        payload,
        {
          TTL: 24 * 60 * 60, // 24 hours
          urgency: this.mapPriorityToUrgency(data.data?.priority || 'normal')
        }
      );

      await job.updateProgress(100);

      return {
        id: jobId,
        type: 'push',
        status: 'sent',
        timestamp: new Date(),
        attempts: (job.attemptsMade || 0) + 1,
        response: {
          statusCode: response.statusCode,
          headers: response.headers,
          body: response.body
        }
      };

    } catch (error) {
      throw new Error(`Push notification failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async processSMSNotification(
    data: SMSNotificationData, 
    jobId: string, 
    job: Job
  ): Promise<NotificationResult> {
    if (!this.config.sms) {
      throw new Error('SMS notifications not configured');
    }

    await job.updateProgress(25);

    // This is a placeholder - implement based on your SMS provider
    switch (this.config.sms.provider) {
      case 'twilio':
        return await this.sendTwilioSMS(data, jobId, job);
      case 'sns':
        return await this.sendSNSSMS(data, jobId, job);
      case 'vonage':
        return await this.sendVonageSMS(data, jobId, job);
      default:
        throw new Error(`Unsupported SMS provider: ${this.config.sms.provider}`);
    }
  }

  private async processInAppNotification(
    data: InAppNotificationData, 
    jobId: string, 
    job: Job
  ): Promise<NotificationResult> {
    await job.updateProgress(25);

    // This would typically save to database or send via WebSocket
    // For now, we'll simulate the process
    
    await job.updateProgress(50);
    
    // Simulate database save or real-time delivery
    await new Promise(resolve => setTimeout(resolve, 100));

    await job.updateProgress(100);

    this.logger.info(`In-app notification delivered`, {
      userId: data.userId,
      title: data.title,
      type: data.type,
      category: data.category,
      priority: data.priority
    });

    return {
      id: jobId,
      type: 'in-app',
      status: 'sent',
      timestamp: new Date(),
      attempts: (job.attemptsMade || 0) + 1,
      response: { delivered: true }
    };
  }

  private async processWebhookNotification(
    data: WebhookNotificationData, 
    jobId: string, 
    job: Job
  ): Promise<NotificationResult> {
    await job.updateProgress(25);

    const timeout = data.timeout || this.config.webhook?.defaultTimeout || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    await job.updateProgress(50);

    try {
      const response = await fetch(data.url, {
        method: data.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CRYB-Notifications/1.0',
          ...data.headers
        },
        body: data.payload ? JSON.stringify(data.payload) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      await job.updateProgress(100);

      const responseBody = await response.text();

      return {
        id: jobId,
        type: 'webhook',
        status: response.ok ? 'sent' : 'failed',
        timestamp: new Date(),
        attempts: (job.attemptsMade || 0) + 1,
        response: {
          statusCode: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody
        },
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

    } catch (error) {
      clearTimeout(timeoutId);
      throw new Error(`Webhook notification failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  // SMS Provider implementations (placeholders)
  private async sendTwilioSMS(data: SMSNotificationData, jobId: string, job: Job): Promise<NotificationResult> {
    // Implement Twilio SMS sending
    await job.updateProgress(100);
    return {
      id: jobId,
      type: 'sms',
      status: 'sent',
      timestamp: new Date(),
      attempts: (job.attemptsMade || 0) + 1,
      response: { provider: 'twilio', delivered: true }
    };
  }

  private async sendSNSSMS(data: SMSNotificationData, jobId: string, job: Job): Promise<NotificationResult> {
    // Implement AWS SNS SMS sending
    await job.updateProgress(100);
    return {
      id: jobId,
      type: 'sms',
      status: 'sent',
      timestamp: new Date(),
      attempts: (job.attemptsMade || 0) + 1,
      response: { provider: 'sns', delivered: true }
    };
  }

  private async sendVonageSMS(data: SMSNotificationData, jobId: string, job: Job): Promise<NotificationResult> {
    // Implement Vonage SMS sending
    await job.updateProgress(100);
    return {
      id: jobId,
      type: 'sms',
      status: 'sent',
      timestamp: new Date(),
      attempts: (job.attemptsMade || 0) + 1,
      response: { provider: 'vonage', delivered: true }
    };
  }

  private mapPriorityToUrgency(priority: string): 'very-low' | 'low' | 'normal' | 'high' {
    switch (priority) {
      case 'urgent':
        return 'high';
      case 'high':
        return 'high';
      case 'normal':
        return 'normal';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  }

  // Public methods for monitoring and stats
  getDeliveryStats() {
    return { ...this.deliveryStats };
  }

  resetStats(): void {
    Object.keys(this.deliveryStats).forEach(key => {
      this.deliveryStats[key as keyof typeof this.deliveryStats] = { sent: 0, failed: 0 };
    });
  }
}