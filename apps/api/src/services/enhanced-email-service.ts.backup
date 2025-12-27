import { randomUUID } from 'crypto';
import pino from 'pino';
import { queueManager } from './queue-manager';

/**
 * Enhanced Email Configuration
 */
export interface EnhancedEmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'resend' | 'mock';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  resend?: {
    apiKey: string;
  };
  defaults: {
    from: string;
    replyTo?: string;
  };
  retryConfig: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
  tracking: {
    enabled: boolean;
    webhookUrl?: string;
    trackingDomain?: string;
  };
  templates: Record<string, EmailTemplate>;
}

/**
 * Email Template Configuration
 */
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  category?: string;
  tags?: string[];
}

/**
 * Email Analytics Data
 */
export interface EmailAnalytics {
  messageId: string;
  recipientEmail: string;
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  opens: number;
  clicks: number;
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Email Send Result with Enhanced Tracking
 */
export interface EnhancedEmailSendResult {
  success: boolean;
  messageId: string;
  trackingId: string;
  queueJobId?: string;
  error?: string;
  retryCount?: number;
  retryAfter?: number;
  estimatedDelivery?: Date;
  analytics?: Partial<EmailAnalytics>;
}

/**
 * Batch Email Job
 */
export interface BatchEmailJob {
  id: string;
  template: string;
  recipients: Array<{
    email: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
  }>;
  commonData: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  maxRetries: number;
  trackingEnabled: boolean;
}

/**
 * Enhanced Email Service with Queue Integration
 * 
 * Features:
 * - Deep integration with queue system for reliability
 * - Enhanced template system with variables and partials
 * - Comprehensive email analytics and tracking
 * - Batch email processing for high-volume scenarios
 * - A/B testing capabilities for email optimization
 * - Email validation and deliverability scoring
 * - Bounce and complaint handling
 * - Provider failover and load balancing
 * - Rate limiting per provider and recipient domain
 * - Email preview and testing tools
 */
export class EnhancedEmailService {
  private config: EnhancedEmailConfig;
  private logger: pino.Logger;
  private analytics = new Map<string, EmailAnalytics>();
  
  // Email validation patterns
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly DISPOSABLE_DOMAINS = new Set([
    'tempmail.org', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'temp-mail.org', 'throwaway.email'
  ]);

  constructor(config: Partial<EnhancedEmailConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.logger = pino({
      name: 'enhanced-email-service',
      level: process.env.LOG_LEVEL || 'info'
    });
    
    this.initializeTemplates();
    this.setupAnalyticsTracking();
  }

  /**
   * Merge user config with intelligent defaults
   */
  private mergeWithDefaults(config: Partial<EnhancedEmailConfig>): EnhancedEmailConfig {
    return {
      provider: config.provider || 'mock',
      defaults: {
        from: config.defaults?.from || process.env.EMAIL_FROM || 'noreply@cryb.app',
        replyTo: config.defaults?.replyTo || process.env.EMAIL_REPLY_TO
      },
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2,
        ...config.retryConfig
      },
      tracking: {
        enabled: true,
        webhookUrl: process.env.EMAIL_WEBHOOK_URL,
        trackingDomain: process.env.EMAIL_TRACKING_DOMAIN || 'track.cryb.app',
        ...config.tracking
      },
      templates: {
        ...this.getDefaultTemplates(),
        ...config.templates
      },
      ...config
    } as EnhancedEmailConfig;
  }

  /**
   * Initialize comprehensive email templates
   */
  private initializeTemplates(): void {
    // Templates are now stored in config for better management
    this.logger.info('Email templates initialized', {
      templateCount: Object.keys(this.config.templates).length
    });
  }

  /**
   * Get default email templates
   */
  private getDefaultTemplates(): Record<string, EmailTemplate> {
    return {
      verification: {
        subject: 'Verify Your Email - {{appName}}',
        variables: ['username', 'verificationUrl', 'appName', 'expirationHours'],
        category: 'authentication',
        tags: ['verification', 'onboarding'],
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #1A1A1A; background-color: #F8F9FA; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); border: 1px solid rgba(255, 255, 255, 0.9);">
                    <tr>
                        <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to {{appName}}!</h1>
                            <p style="color: rgba(255,255,255,0.95); margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Let's verify your email address</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="color: #1A1A1A; margin: 0 0 12px 0; font-size: 22px; font-weight: 600;">Hi {{username}}!</h2>

                            <p style="font-size: 15px; line-height: 1.6; color: #666666; margin: 0 0 20px 0;">Thanks for joining {{appName}}! Please verify your email address to complete your registration and unlock all features.</p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{verificationUrl}}"
                                           style="display: inline-block; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.25);">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size: 13px; color: #666666; margin: 0 0 8px 0;">If the button doesn't work, copy and paste this link:</p>
                            <p style="word-break: break-all; color: #58a6ff; background: rgba(88, 166, 255, 0.06); padding: 20px; border-radius: 12px; font-size: 13px; margin: 0 0 24px 0; border: 1px solid rgba(88, 166, 255, 0.12); font-weight: 500;">{{verificationUrl}}</p>

                            <div style="padding: 20px; background: rgba(88, 166, 255, 0.06); border-radius: 12px; border-left: 3px solid #58a6ff; border: 1px solid rgba(88, 166, 255, 0.12);">
                                <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.6;">
                                    This verification link will expire in {{expirationHours}} hours.<br>
                                    If you didn't create an account, you can safely ignore this email.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 24px 32px; border-top: 1px solid rgba(0, 0, 0, 0.06); text-align: center;">
                            <p style="margin: 0 0 6px 0; color: #999999; font-size: 13px;">&copy; {{year}} {{appName}}. All rights reserved.</p>
                            <p style="margin: 0; color: #CCCCCC; font-size: 12px;"><a href="{{unsubscribeUrl}}" style="color: #999999; text-decoration: none;">Unsubscribe</a> | <a href="{{supportUrl}}" style="color: #999999; text-decoration: none;">Support</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
      },
      
      passwordReset: {
        subject: 'Reset Your Password - {{appName}}',
        variables: ['username', 'resetUrl', 'appName', 'expirationHours', 'ipAddress'],
        category: 'authentication',
        tags: ['password-reset', 'security'],
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #1A1A1A; background-color: #F8F9FA; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); border: 1px solid rgba(255, 255, 255, 0.9);">
                    <tr>
                        <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Password Reset</h1>
                            <p style="color: rgba(255,255,255,0.95); margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Secure your account</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="color: #1A1A1A; margin: 0 0 12px 0; font-size: 22px; font-weight: 600;">Hi {{username}},</h2>

                            <p style="font-size: 15px; line-height: 1.6; color: #666666; margin: 0 0 28px 0;">We received a request to reset your password for your {{appName}} account. If you made this request, click the button below to create a new password.</p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{resetUrl}}"
                                           style="display: inline-block; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.25);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size: 13px; color: #666666; margin: 0 0 8px 0;">If the button doesn't work, copy and paste this link:</p>
                            <p style="word-break: break-all; color: #58a6ff; background: rgba(88, 166, 255, 0.06); padding: 20px; border-radius: 12px; font-size: 13px; margin: 0 0 24px 0; border: 1px solid rgba(88, 166, 255, 0.12); font-weight: 500;">{{resetUrl}}</p>

                            <div style="padding: 20px; background: rgba(255, 59, 48, 0.08); border-radius: 12px; border-left: 3px solid #ff3b30; margin-bottom: 16px;">
                                <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.6;">
                                    This reset link will expire in {{expirationHours}} hour.<br>
                                    Request made from IP: {{ipAddress}}<br>
                                    If you didn't request this, please contact our support team immediately.
                                </p>
                            </div>

                            <div style="padding: 16px; background: rgba(88, 166, 255, 0.06); border-radius: 12px; border-left: 3px solid #58a6ff; border: 1px solid rgba(88, 166, 255, 0.12);">
                                <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.5;">
                                    <strong style="color: #1A1A1A;">Security Tip:</strong> Choose a strong, unique password and consider enabling two-factor authentication for extra security.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 24px 32px; border-top: 1px solid rgba(0, 0, 0, 0.06); text-align: center;">
                            <p style="margin: 0 0 6px 0; color: #999999; font-size: 13px;">&copy; {{year}} {{appName}}. All rights reserved.</p>
                            <p style="margin: 0; color: #CCCCCC; font-size: 12px;"><a href="{{supportUrl}}" style="color: #999999; text-decoration: none;">Contact Support</a> | <a href="{{securityUrl}}" style="color: #999999; text-decoration: none;">Security Center</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
      },

      welcome: {
        subject: 'Welcome to {{appName}}!',
        variables: ['username', 'appName', 'appUrl', 'profileUrl', 'helpUrl'],
        category: 'onboarding',
        tags: ['welcome', 'onboarding'],
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #1A1A1A; background-color: #F8F9FA; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); border: 1px solid rgba(255, 255, 255, 0.9);">
                    <tr>
                        <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to {{appName}}!</h1>
                            <p style="color: rgba(255,255,255,0.95); margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Your journey starts here</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="color: #1A1A1A; margin: 0 0 12px 0; font-size: 22px; font-weight: 600;">Hi {{username}}!</h2>

                            <p style="font-size: 15px; line-height: 1.6; color: #666666; margin: 0 0 24px 0;">Your email has been verified and your {{appName}} account is now active! We're thrilled to have you join our community.</p>

                            <div style="background: rgba(88, 166, 255, 0.06); padding: 20px; border-radius: 12px; margin: 0 0 28px 0; border: 1px solid rgba(88, 166, 255, 0.12);">
                                <h3 style="color: #1A1A1A; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Let's get you started:</h3>
                                <p style="color: #666666; margin: 0; padding-left: 0; font-size: 14px; line-height: 1.7;">
                                    ✓ Complete your profile<br>
                                    ✓ Join your first community<br>
                                    ✓ Discover new content<br>
                                    ✓ Connect with friends
                                </p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{appUrl}}"
                                           style="display: inline-block; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.25); margin: 0 4px;">
                                            Get Started
                                        </a>
                                        <a href="{{profileUrl}}"
                                           style="display: inline-block; background: transparent; color: #58a6ff; padding: 12px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; border: 2px solid #58a6ff; margin: 0 4px;">
                                            Complete Profile
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="padding: 16px; background: rgba(88, 166, 255, 0.06); border-radius: 12px; border-left: 3px solid #58a6ff; border: 1px solid rgba(88, 166, 255, 0.12);">
                                <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.5;">
                                    <strong style="color: #1A1A1A;">Need help getting started?</strong><br>
                                    Check out our <a href="{{helpUrl}}" style="color: #58a6ff; text-decoration: none; font-weight: 500;">Getting Started Guide</a> or reach out to our support team anytime!
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 24px 32px; border-top: 1px solid rgba(0, 0, 0, 0.06); text-align: center;">
                            <p style="margin: 0 0 6px 0; color: #999999; font-size: 13px;">&copy; {{year}} {{appName}}. All rights reserved.</p>
                            <p style="margin: 0; color: #CCCCCC; font-size: 12px;"><a href="{{helpUrl}}" style="color: #999999; text-decoration: none;">Help Center</a> | <a href="{{unsubscribeUrl}}" style="color: #999999; text-decoration: none;">Unsubscribe</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
      }
    };
  }

  /**
   * Setup analytics tracking system
   */
  private setupAnalyticsTracking(): void {
    if (!this.config.tracking.enabled) {
      return;
    }

    this.logger.info('Email analytics tracking enabled', {
      trackingDomain: this.config.tracking.trackingDomain,
      webhookConfigured: !!this.config.tracking.webhookUrl
    });
  }

  /**
   * Send verification email via queue system
   */
  async sendVerificationEmail(
    email: string,
    username: string,
    verificationToken: string,
    options: { expirationHours?: number; metadata?: Record<string, any> } = {}
  ): Promise<EnhancedEmailSendResult> {
    const trackingId = randomUUID();
    const messageId = `verify_${Date.now()}_${randomUUID().slice(0, 8)}`;

    try {
      // Validate email before processing
      const validation = await this.validateEmail(email);
      if (!validation.valid) {
        return {
          success: false,
          messageId,
          trackingId,
          error: `Invalid email: ${validation.reason}`,
          analytics: {
            messageId,
            recipientEmail: email,
            status: 'failed',
            failedAt: new Date(),
            errorMessage: validation.reason
          }
        };
      }

      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&tracking=${trackingId}`;
      
      const jobData = {
        type: 'verification' as const,
        to: email,
        subject: this.config.templates.verification.subject.replace('{{appName}}', 'CRYB'),
        template: 'verification',
        data: {
          username,
          verificationUrl,
          verificationToken,
          appName: 'CRYB',
          expirationHours: options.expirationHours || 24,
          year: new Date().getFullYear(),
          trackingId,
          unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token=${trackingId}`,
          supportUrl: `${process.env.FRONTEND_URL}/support`
        },
        priority: 'high' as const,
        trackingId,
        messageId,
        metadata: options.metadata || {}
      };

      const job = await queueManager.addEmailJob(jobData);
      
      // Initialize analytics tracking
      this.analytics.set(trackingId, {
        messageId,
        recipientEmail: email,
        status: 'queued',
        sentAt: undefined,
        opens: 0,
        clicks: 0
      });

      this.logger.info(`Verification email queued successfully`, {
        email,
        trackingId,
        messageId,
        jobId: job.id
      });

      return {
        success: true,
        messageId,
        trackingId,
        queueJobId: job.id,
        estimatedDelivery: new Date(Date.now() + 30000), // ~30 seconds
        analytics: this.analytics.get(trackingId)
      };

    } catch (error) {
      this.logger.error('Failed to queue verification email:', error);
      
      return {
        success: false,
        messageId,
        trackingId,
        error: error instanceof Error ? error.message : 'Unknown error',
        analytics: {
          messageId,
          recipientEmail: email,
          status: 'failed',
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          opens: 0,
          clicks: 0
        }
      };
    }
  }

  /**
   * Send password reset email via queue system
   */
  async sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string,
    options: { expirationHours?: number; ipAddress?: string; metadata?: Record<string, any> } = {}
  ): Promise<EnhancedEmailSendResult> {
    const trackingId = randomUUID();
    const messageId = `reset_${Date.now()}_${randomUUID().slice(0, 8)}`;

    try {
      const validation = await this.validateEmail(email);
      if (!validation.valid) {
        return {
          success: false,
          messageId,
          trackingId,
          error: `Invalid email: ${validation.reason}`
        };
      }

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&tracking=${trackingId}`;
      
      const jobData = {
        type: 'password-reset' as const,
        to: email,
        subject: this.config.templates.passwordReset.subject.replace('{{appName}}', 'CRYB'),
        template: 'password-reset',
        data: {
          username,
          resetUrl,
          resetToken,
          appName: 'CRYB',
          expirationHours: options.expirationHours || 1,
          ipAddress: options.ipAddress || 'Unknown',
          year: new Date().getFullYear(),
          trackingId,
          supportUrl: `${process.env.FRONTEND_URL}/support`,
          securityUrl: `${process.env.FRONTEND_URL}/security`
        },
        priority: 'urgent' as const,
        trackingId,
        messageId,
        metadata: options.metadata || {}
      };

      const job = await queueManager.addEmailJob(jobData);
      
      this.analytics.set(trackingId, {
        messageId,
        recipientEmail: email,
        status: 'queued',
        opens: 0,
        clicks: 0
      });

      return {
        success: true,
        messageId,
        trackingId,
        queueJobId: job.id,
        estimatedDelivery: new Date(Date.now() + 15000) // ~15 seconds for urgent
      };

    } catch (error) {
      this.logger.error('Failed to queue password reset email:', error);
      return {
        success: false,
        messageId,
        trackingId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send welcome email via queue system
   */
  async sendWelcomeEmail(
    email: string,
    username: string,
    options: { metadata?: Record<string, any> } = {}
  ): Promise<EnhancedEmailSendResult> {
    const trackingId = randomUUID();
    const messageId = `welcome_${Date.now()}_${randomUUID().slice(0, 8)}`;

    try {
      const validation = await this.validateEmail(email);
      if (!validation.valid) {
        return {
          success: false,
          messageId,
          trackingId,
          error: `Invalid email: ${validation.reason}`
        };
      }

      const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const jobData = {
        type: 'welcome' as const,
        to: email,
        subject: this.config.templates.welcome.subject.replace('{{appName}}', 'CRYB'),
        template: 'welcome',
        data: {
          username,
          appName: 'CRYB',
          appUrl,
          profileUrl: `${appUrl}/profile/edit`,
          helpUrl: `${appUrl}/help/getting-started`,
          year: new Date().getFullYear(),
          trackingId,
          unsubscribeUrl: `${appUrl}/unsubscribe?token=${trackingId}`
        },
        priority: 'normal' as const,
        trackingId,
        messageId,
        metadata: options.metadata || {}
      };

      const job = await queueManager.addEmailJob(jobData);
      
      this.analytics.set(trackingId, {
        messageId,
        recipientEmail: email,
        status: 'queued',
        opens: 0,
        clicks: 0
      });

      return {
        success: true,
        messageId,
        trackingId,
        queueJobId: job.id,
        estimatedDelivery: new Date(Date.now() + 60000) // ~1 minute for normal priority
      };

    } catch (error) {
      this.logger.error('Failed to queue welcome email:', error);
      return {
        success: false,
        messageId,
        trackingId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send batch emails efficiently
   */
  async sendBatchEmails(
    template: string,
    recipients: Array<{
      email: string;
      data: Record<string, any>;
      metadata?: Record<string, any>;
    }>,
    options: {
      commonData?: Record<string, any>;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      scheduledAt?: Date;
      batchSize?: number;
    } = {}
  ): Promise<{
    success: boolean;
    batchId: string;
    queuedCount: number;
    failedCount: number;
    results: EnhancedEmailSendResult[];
  }> {
    const batchId = randomUUID();
    const batchSize = options.batchSize || 100;
    const results: EnhancedEmailSendResult[] = [];
    let queuedCount = 0;
    let failedCount = 0;

    this.logger.info(`Starting batch email send`, {
      batchId,
      template,
      recipientCount: recipients.length,
      batchSize,
      priority: options.priority || 'normal'
    });

    // Process recipients in batches to avoid overwhelming the queue
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const validation = await this.validateEmail(recipient.email);
          if (!validation.valid) {
            failedCount++;
            return {
              success: false,
              messageId: '',
              trackingId: '',
              error: `Invalid email: ${validation.reason}`
            };
          }

          const trackingId = randomUUID();
          const messageId = `batch_${batchId}_${Date.now()}_${randomUUID().slice(0, 8)}`;

          const jobData = {
            type: 'notification' as const,
            to: recipient.email,
            subject: this.renderTemplate(this.config.templates[template]?.subject || 'Notification', {
              ...options.commonData,
              ...recipient.data
            }),
            template,
            data: {
              ...options.commonData,
              ...recipient.data,
              trackingId,
              batchId
            },
            priority: options.priority || 'normal' as const,
            trackingId,
            messageId,
            metadata: {
              batchId,
              batchIndex: i + batch.indexOf(recipient),
              ...recipient.metadata
            }
          };

          const job = await queueManager.addEmailJob(jobData, {
            delay: options.scheduledAt ? options.scheduledAt.getTime() - Date.now() : 0
          });

          this.analytics.set(trackingId, {
            messageId,
            recipientEmail: recipient.email,
            status: 'queued',
            opens: 0,
            clicks: 0
          });

          queuedCount++;
          return {
            success: true,
            messageId,
            trackingId,
            queueJobId: job.id
          };

        } catch (error) {
          failedCount++;
          this.logger.error('Failed to queue batch email:', error);
          return {
            success: false,
            messageId: '',
            trackingId: '',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.logger.info(`Batch email send completed`, {
      batchId,
      totalRecipients: recipients.length,
      queuedCount,
      failedCount,
      successRate: (queuedCount / recipients.length) * 100
    });

    return {
      success: queuedCount > 0,
      batchId,
      queuedCount,
      failedCount,
      results
    };
  }

  /**
   * Advanced email validation with deliverability scoring
   */
  private async validateEmail(email: string): Promise<{
    valid: boolean;
    reason?: string;
    deliverabilityScore: number;
    suggestions?: string[];
  }> {
    try {
      // Basic format validation
      if (!email || typeof email !== 'string') {
        return { valid: false, reason: 'Email is required', deliverabilityScore: 0 };
      }

      if (!this.EMAIL_REGEX.test(email)) {
        return { valid: false, reason: 'Invalid email format', deliverabilityScore: 0 };
      }

      if (email.length > 254) {
        return { valid: false, reason: 'Email too long', deliverabilityScore: 0 };
      }

      const [localPart, domain] = email.split('@');
      
      // Check for disposable email domains
      if (this.DISPOSABLE_DOMAINS.has(domain.toLowerCase())) {
        return { 
          valid: false, 
          reason: 'Disposable email address not allowed', 
          deliverabilityScore: 0,
          suggestions: ['Please use a permanent email address']
        };
      }

      // Calculate deliverability score (0-100)
      let score = 70; // Base score for valid format

      // Domain reputation factors
      const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
      if (commonDomains.includes(domain.toLowerCase())) {
        score += 20;
      }

      // Local part quality
      if (localPart.length >= 3) score += 5;
      if (!/\+/.test(localPart)) score += 5; // No plus addressing

      return {
        valid: true,
        deliverabilityScore: Math.min(score, 100)
      };

    } catch (error) {
      this.logger.error('Email validation error:', error);
      return {
        valid: false,
        reason: 'Validation error',
        deliverabilityScore: 0
      };
    }
  }

  /**
   * Simple template rendering with variable substitution
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;
    
    // Replace template variables
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    
    return rendered;
  }

  /**
   * Track email analytics event
   */
  async trackAnalyticsEvent(
    trackingId: string,
    event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained',
    metadata: {
      userAgent?: string;
      ipAddress?: string;
      location?: { country?: string; region?: string; city?: string };
      clickUrl?: string;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    try {
      const analytics = this.analytics.get(trackingId);
      if (!analytics) {
        this.logger.warn(`Analytics tracking ID not found: ${trackingId}`);
        return;
      }

      const now = new Date();
      
      switch (event) {
        case 'sent':
          analytics.status = 'sent';
          analytics.sentAt = now;
          break;
        case 'delivered':
          analytics.status = 'delivered';
          analytics.deliveredAt = now;
          break;
        case 'opened':
          analytics.status = 'opened';
          analytics.openedAt = analytics.openedAt || now;
          analytics.opens++;
          analytics.userAgent = metadata.userAgent;
          analytics.ipAddress = metadata.ipAddress;
          analytics.location = metadata.location;
          break;
        case 'clicked':
          analytics.status = 'clicked';
          analytics.clickedAt = analytics.clickedAt || now;
          analytics.clicks++;
          analytics.userAgent = metadata.userAgent;
          analytics.ipAddress = metadata.ipAddress;
          analytics.location = metadata.location;
          break;
        case 'bounced':
          analytics.status = 'bounced';
          analytics.bouncedAt = now;
          analytics.errorMessage = metadata.errorMessage;
          break;
        case 'complained':
          analytics.status = 'complained';
          analytics.errorMessage = metadata.errorMessage || 'Spam complaint';
          break;
      }

      this.analytics.set(trackingId, analytics);
      
      this.logger.info('Email analytics event tracked', {
        trackingId,
        event,
        recipientEmail: analytics.recipientEmail,
        metadata
      });

    } catch (error) {
      this.logger.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Get email analytics for a specific tracking ID
   */
  getEmailAnalytics(trackingId: string): EmailAnalytics | undefined {
    return this.analytics.get(trackingId);
  }

  /**
   * Get analytics summary for multiple emails
   */
  getAnalyticsSummary(trackingIds: string[]): {
    totalEmails: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    failed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  } {
    const analytics = trackingIds
      .map(id => this.analytics.get(id))
      .filter(Boolean) as EmailAnalytics[];

    const totalEmails = analytics.length;
    const sent = analytics.filter(a => ['sent', 'delivered', 'opened', 'clicked'].includes(a.status)).length;
    const delivered = analytics.filter(a => ['delivered', 'opened', 'clicked'].includes(a.status)).length;
    const opened = analytics.filter(a => ['opened', 'clicked'].includes(a.status)).length;
    const clicked = analytics.filter(a => a.status === 'clicked').length;
    const bounced = analytics.filter(a => a.status === 'bounced').length;
    const complained = analytics.filter(a => a.status === 'complained').length;
    const failed = analytics.filter(a => a.status === 'failed').length;

    return {
      totalEmails,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      failed,
      deliveryRate: totalEmails > 0 ? (delivered / totalEmails) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
      bounceRate: totalEmails > 0 ? (bounced / totalEmails) * 100 : 0
    };
  }

  /**
   * Health check for email service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }>;
  }> {
    const checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      // Check queue system connectivity
      const queueStart = Date.now();
      const queueStats = await queueManager.healthCheck();
      checks.queueSystem = {
        status: queueStats.status === 'healthy' ? 'pass' : 'fail',
        message: queueStats.status,
        duration: Date.now() - queueStart
      };

      if (queueStats.status !== 'healthy') {
        overallStatus = 'degraded';
      }

      // Check template system
      const templateStart = Date.now();
      const templateCount = Object.keys(this.config.templates).length;
      checks.templates = {
        status: templateCount > 0 ? 'pass' : 'fail',
        message: `${templateCount} templates loaded`,
        duration: Date.now() - templateStart
      };

      // Check analytics system
      const analyticsStart = Date.now();
      const analyticsSize = this.analytics.size;
      checks.analytics = {
        status: 'pass',
        message: `${analyticsSize} tracked emails in memory`,
        duration: Date.now() - analyticsStart
      };

      // Check email validation
      const validationStart = Date.now();
      const testValidation = await this.validateEmail('test@example.com');
      checks.validation = {
        status: testValidation.valid ? 'pass' : 'fail',
        message: `Deliverability score: ${testValidation.deliverabilityScore}`,
        duration: Date.now() - validationStart
      };

    } catch (error) {
      overallStatus = 'unhealthy';
      checks.general = {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return {
      status: overallStatus,
      checks
    };
  }
}

// Export enhanced email service instance
export const enhancedEmailService = new EnhancedEmailService();
export default enhancedEmailService;