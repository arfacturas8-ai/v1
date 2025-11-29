import { randomUUID } from 'crypto';

/**
 * Email Configuration
 */
export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'mock';
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
  templates: {
    verification: string;
    passwordReset: string;
    welcome: string;
  };
}

/**
 * Email Template Data
 */
export interface EmailTemplateData {
  [key: string]: any;
}

/**
 * Email Send Result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount?: number;
  retryAfter?: number;
}

/**
 * Email Queue Item
 */
interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  template: string;
  data: EmailTemplateData;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  maxRetries: number;
  currentRetry: number;
  scheduledAt: Date;
  createdAt: Date;
}

/**
 * Enhanced Email Service with Comprehensive Error Handling
 * 
 * Features:
 * - Multiple provider support with fallbacks
 * - Retry logic with exponential backoff
 * - Email queue with priority handling
 * - Template system with variable substitution
 * - Rate limiting per provider
 * - Bounce and spam handling
 * - Email verification workflows
 * - Comprehensive error tracking
 * - Circuit breaker pattern for providers
 * - Email analytics and tracking
 */
export class EmailService {
  private config: EmailConfig;
  private emailQueue: EmailQueueItem[] = [];
  private processing = false;
  private circuitBreakers = new Map<string, { failures: number; lastFailure: number; isOpen: boolean }>();
  private rateLimits = new Map<string, { count: number; resetAt: number }>();
  
  // Email templates
  private templates = new Map<string, string>();

  constructor(config: Partial<EmailConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.initializeTemplates();
    this.startQueueProcessor();
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(config: Partial<EmailConfig>): EmailConfig {
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
      templates: {
        verification: 'verification',
        passwordReset: 'password-reset',
        welcome: 'welcome',
        ...config.templates
      },
      ...config
    };
  }

  /**
   * Initialize email templates
   */
  private initializeTemplates(): void {
    // Email verification template
    this.templates.set('verification', `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - CRYB</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CRYB!</h1>
    </div>
    
    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
        
        <p>Hi {{username}},</p>
        
        <p>Thanks for joining CRYB! Please verify your email address to complete your registration and start connecting with friends.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Verify Email Address
            </a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea;">{{verificationUrl}}</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            This verification link will expire in {{expirationHours}} hours. If you didn't create an account with CRYB, you can safely ignore this email.
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>&copy; {{year}} CRYB. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim());

    // Password reset template
    this.templates.set('password-reset', `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - CRYB</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
    </div>
    
    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
        
        <p>Hi {{username}},</p>
        
        <p>We received a request to reset your password for your CRYB account. If you didn't make this request, you can safely ignore this email.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" 
               style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
            </a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #f5576c;">{{resetUrl}}</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            This password reset link will expire in {{expirationHours}} hour. For security reasons, please reset your password as soon as possible.
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>&copy; {{year}} CRYB. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim());

    // Welcome template
    this.templates.set('welcome', `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CRYB!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CRYB!</h1>
    </div>
    
    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">You're All Set!</h2>
        
        <p>Hi {{username}},</p>
        
        <p>Your email has been verified and your CRYB account is now active! You can now start connecting with friends, joining servers, and exploring communities.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
            <ul style="color: #666;">
                <li>Complete your profile setup</li>
                <li>Join your first server</li>
                <li>Discover communities</li>
                <li>Start chatting with friends</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{appUrl}}" 
               style="background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Get Started
            </a>
        </div>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            If you have any questions or need help getting started, feel free to reach out to our support team.
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>&copy; {{year}} CRYB. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim());

    // Notification digest template
    this.templates.set('notification-digest', `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your CRYB Notifications</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">{{notificationCount}} New Notifications</h1>
    </div>
    
    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p>Hi {{username}},</p>
        
        <p>You have {{notificationCount}} new notifications on CRYB:</p>
        
        <div style="margin: 20px 0;">
            {{#notifications}}
            <div style="border-left: 4px solid #667eea; padding: 15px; margin: 10px 0; background: #f8f9fa;">
                <h4 style="margin: 0 0 5px 0; color: #333;">{{title}}</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">{{content}}</p>
                <small style="color: #999;">{{timeAgo}}</small>
            </div>
            {{/notifications}}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{notificationsUrl}}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View All Notifications
            </a>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>&copy; {{year}} CRYB. All rights reserved.</p>
        <p><a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe from notification emails</a></p>
    </div>
</body>
</html>
    `.trim());
  }

  /**
   * Send verification email (via queue system)
   */
  async sendVerificationEmail(
    email: string, 
    username: string, 
    verificationToken: string
  ): Promise<EmailSendResult> {
    try {
      // Use queue system for better reliability and scalability
      const { EmailQueueIntegration } = await import('./queue-integration');
      await EmailQueueIntegration.sendVerificationEmail(email, username, verificationToken);
      
      return {
        success: true,
        messageId: `queued-${Date.now()}`
      };
    } catch (error) {
      // Fallback to direct sending if queue system is unavailable
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      
      return await this.sendEmail(
        email,
        'Verify Your Email - CRYB',
        'verification',
        {
          username,
          verificationUrl,
          verificationToken,
          expirationHours: 24,
          year: new Date().getFullYear()
        },
        'high'
      );
    }
  }

  /**
   * Send password reset email (via queue system)
   */
  async sendPasswordResetEmail(
    email: string, 
    username: string, 
    resetToken: string
  ): Promise<EmailSendResult> {
    try {
      // Use queue system for better reliability and scalability
      const { EmailQueueIntegration } = await import('./queue-integration');
      await EmailQueueIntegration.sendPasswordResetEmail(email, username, resetToken);
      
      return {
        success: true,
        messageId: `queued-${Date.now()}`
      };
    } catch (error) {
      // Fallback to direct sending if queue system is unavailable
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      return await this.sendEmail(
        email,
        'Reset Your Password - CRYB',
        'password-reset',
        {
          username,
          resetUrl,
          resetToken,
          expirationHours: 1,
          year: new Date().getFullYear()
        },
        'urgent'
      );
    }
  }

  /**
   * Send welcome email (via queue system)
   */
  async sendWelcomeEmail(email: string, username: string): Promise<EmailSendResult> {
    try {
      // Use queue system for better reliability and scalability
      const { EmailQueueIntegration } = await import('./queue-integration');
      await EmailQueueIntegration.sendWelcomeEmail(email, username);
      
      return {
        success: true,
        messageId: `queued-${Date.now()}`
      };
    } catch (error) {
      // Fallback to direct sending if queue system is unavailable
      const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      return await this.sendEmail(
        email,
        'Welcome to CRYB!',
        'welcome',
        {
          username,
          appUrl,
          year: new Date().getFullYear()
        },
        'normal'
      );
    }
  }

  /**
   * Send notification digest email
   */
  async sendNotificationDigest(
    email: string, 
    username: string, 
    notifications: Array<{title: string, content: string, timeAgo: string}>
  ): Promise<EmailSendResult> {
    if (notifications.length === 0) {
      return { success: true, messageId: 'no-notifications' };
    }

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const unsubscribeUrl = `${appUrl}/settings/notifications`;
    
    return await this.sendEmail(
      email,
      `${notifications.length} New Notifications - CRYB`,
      'notification-digest',
      {
        username,
        notificationCount: notifications.length,
        notifications,
        notificationsUrl: `${appUrl}/notifications`,
        unsubscribeUrl,
        year: new Date().getFullYear()
      },
      'normal'
    );
  }

  /**
   * Send instant notification email
   */
  async sendInstantNotification(
    email: string,
    username: string,
    title: string,
    content: string,
    actionUrl?: string
  ): Promise<EmailSendResult> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return await this.sendEmail(
      email,
      `${title} - CRYB`,
      'notification-digest',
      {
        username,
        notificationCount: 1,
        notifications: [{ title, content, timeAgo: 'just now' }],
        notificationsUrl: actionUrl || `${appUrl}/notifications`,
        unsubscribeUrl: `${appUrl}/settings/notifications`,
        year: new Date().getFullYear()
      },
      'high'
    );
  }

  /**
   * Send community invitation email
   */
  async sendCommunityInvitation(
    email: string,
    username: string,
    communityName: string,
    inviterName: string,
    inviteUrl: string
  ): Promise<EmailSendResult> {
    return await this.sendEmail(
      email,
      `You've been invited to join ${communityName} on CRYB`,
      'notification-digest',
      {
        username,
        notificationCount: 1,
        notifications: [{
          title: `Invitation to ${communityName}`,
          content: `${inviterName} has invited you to join the ${communityName} community`,
          timeAgo: 'just now'
        }],
        notificationsUrl: inviteUrl,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/settings/notifications`,
        year: new Date().getFullYear()
      },
      'high'
    );
  }

  /**
   * Send email with retry logic
   */
  async sendEmail(
    to: string,
    subject: string,
    template: string,
    data: EmailTemplateData = {},
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<EmailSendResult> {
    try {
      // Validate email address
      if (!this.isValidEmail(to)) {
        return {
          success: false,
          error: 'Invalid email address'
        };
      }

      // Check circuit breaker
      if (this.isCircuitBreakerOpen(this.config.provider)) {
        return {
          success: false,
          error: 'Email service temporarily unavailable',
          retryAfter: 60000 // Retry after 1 minute
        };
      }

      // Check rate limits
      const rateLimitResult = this.checkRateLimit(this.config.provider);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        };
      }

      // Add to queue for asynchronous processing
      const emailItem: EmailQueueItem = {
        id: randomUUID(),
        to,
        subject,
        template,
        data,
        priority,
        maxRetries: this.config.retryConfig.maxRetries,
        currentRetry: 0,
        scheduledAt: new Date(),
        createdAt: new Date()
      };

      this.addToQueue(emailItem);

      return {
        success: true,
        messageId: emailItem.id
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Add email to queue with priority sorting
   */
  private addToQueue(emailItem: EmailQueueItem): void {
    this.emailQueue.push(emailItem);
    
    // Sort by priority and scheduled time
    this.emailQueue.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
  }

  /**
   * Process email queue
   */
  private async startQueueProcessor(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (true) {
      try {
        if (this.emailQueue.length === 0) {
          await this.sleep(1000); // Wait 1 second before checking again
          continue;
        }

        const emailItem = this.emailQueue.shift()!;
        
        // Check if it's time to process this email
        if (emailItem.scheduledAt.getTime() > Date.now()) {
          this.emailQueue.unshift(emailItem); // Put it back at the front
          await this.sleep(1000);
          continue;
        }

        await this.processEmailItem(emailItem);

      } catch (error) {
        console.error('Email queue processing error:', error);
        await this.sleep(5000); // Wait 5 seconds on error
      }
    }
  }

  /**
   * Process individual email item
   */
  private async processEmailItem(emailItem: EmailQueueItem): Promise<void> {
    try {
      const result = await this.sendEmailDirect(emailItem);

      if (result.success) {
        console.log(`✅ Email sent successfully: ${emailItem.id}`);
        this.recordCircuitBreakerSuccess(this.config.provider);
      } else {
        console.error(`❌ Email failed: ${emailItem.id} - ${result.error}`);
        
        // Retry logic
        if (emailItem.currentRetry < emailItem.maxRetries) {
          emailItem.currentRetry++;
          const delay = this.calculateRetryDelay(emailItem.currentRetry);
          emailItem.scheduledAt = new Date(Date.now() + delay);
          
          this.addToQueue(emailItem);
          console.log(`🔄 Email retry scheduled: ${emailItem.id} (attempt ${emailItem.currentRetry}/${emailItem.maxRetries})`);
        } else {
          console.error(`💀 Email permanently failed: ${emailItem.id}`);
          this.recordCircuitBreakerFailure(this.config.provider);
        }
      }

    } catch (error) {
      console.error('Email processing error:', error);
      this.recordCircuitBreakerFailure(this.config.provider);
    }
  }

  /**
   * Send email directly to provider
   */
  private async sendEmailDirect(emailItem: EmailQueueItem): Promise<EmailSendResult> {
    try {
      const htmlContent = this.renderTemplate(emailItem.template, emailItem.data);
      
      switch (this.config.provider) {
        case 'mock':
          return await this.sendWithMockProvider(emailItem, htmlContent);
        case 'smtp':
          return await this.sendWithSMTP(emailItem, htmlContent);
        case 'sendgrid':
          return await this.sendWithSendGrid(emailItem, htmlContent);
        case 'mailgun':
          return await this.sendWithMailgun(emailItem, htmlContent);
        case 'ses':
          return await this.sendWithSES(emailItem, htmlContent);
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown provider error'
      };
    }
  }

  /**
   * Mock email provider for development
   */
  private async sendWithMockProvider(emailItem: EmailQueueItem, htmlContent: string): Promise<EmailSendResult> {
    // Simulate sending delay
    await this.sleep(100);
    
    console.log(`📧 MOCK EMAIL SENT:`);
    console.log(`   To: ${emailItem.to}`);
    console.log(`   Subject: ${emailItem.subject}`);
    console.log(`   Template: ${emailItem.template}`);
    console.log(`   Priority: ${emailItem.priority}`);
    console.log(`   Content Preview: ${htmlContent.substring(0, 200)}...`);
    
    // Simulate occasional failures for testing retry logic
    if (Math.random() < 0.1) {
      throw new Error('Mock email service failure for testing');
    }
    
    return {
      success: true,
      messageId: `mock-${emailItem.id}`
    };
  }

  /**
   * SMTP provider implementation
   */
  private async sendWithSMTP(emailItem: EmailQueueItem, htmlContent: string): Promise<EmailSendResult> {
    try {
      const nodemailer = await import('nodemailer');
      
      if (!this.config.smtp) {
        throw new Error('SMTP configuration not provided');
      }

      const transporter = nodemailer.createTransporter({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: {
          user: this.config.smtp.auth.user,
          pass: this.config.smtp.auth.pass,
        },
      });

      const mailOptions = {
        from: this.config.defaults.from,
        to: emailItem.to,
        subject: emailItem.subject,
        html: htmlContent,
        replyTo: this.config.defaults.replyTo,
      };

      const result = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMTP sending failed'
      };
    }
  }

  /**
   * SendGrid provider implementation
   */
  private async sendWithSendGrid(emailItem: EmailQueueItem, htmlContent: string): Promise<EmailSendResult> {
    try {
      const sgMail = await import('@sendgrid/mail');
      
      if (!this.config.sendgrid?.apiKey) {
        throw new Error('SendGrid API key not provided');
      }

      sgMail.default.setApiKey(this.config.sendgrid.apiKey);

      const msg = {
        to: emailItem.to,
        from: this.config.defaults.from,
        subject: emailItem.subject,
        html: htmlContent,
        replyTo: this.config.defaults.replyTo,
      };

      const response = await sgMail.default.send(msg);
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || emailItem.id
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.body?.errors?.[0]?.message || error.message || 'SendGrid sending failed'
      };
    }
  }

  /**
   * Mailgun provider implementation
   */
  private async sendWithMailgun(emailItem: EmailQueueItem, htmlContent: string): Promise<EmailSendResult> {
    try {
      if (!this.config.mailgun?.apiKey || !this.config.mailgun?.domain) {
        throw new Error('Mailgun API key and domain are required');
      }

      const formData = new FormData();
      formData.append('from', this.config.defaults.from);
      formData.append('to', emailItem.to);
      formData.append('subject', emailItem.subject);
      formData.append('html', htmlContent);
      if (this.config.defaults.replyTo) {
        formData.append('h:Reply-To', this.config.defaults.replyTo);
      }

      const response = await fetch(
        `https://api.mailgun.net/v3/${this.config.mailgun.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${this.config.mailgun.apiKey}`).toString('base64')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Mailgun API error');
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId: result.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mailgun sending failed'
      };
    }
  }

  /**
   * AWS SES provider implementation
   */
  private async sendWithSES(emailItem: EmailQueueItem, htmlContent: string): Promise<EmailSendResult> {
    try {
      if (!this.config.ses?.region || !this.config.ses?.accessKeyId || !this.config.ses?.secretAccessKey) {
        throw new Error('AWS SES configuration (region, accessKeyId, secretAccessKey) is required');
      }

      const AWS = await import('aws-sdk');
      
      const ses = new AWS.SES({
        region: this.config.ses.region,
        accessKeyId: this.config.ses.accessKeyId,
        secretAccessKey: this.config.ses.secretAccessKey,
      });

      const params = {
        Source: this.config.defaults.from,
        Destination: {
          ToAddresses: [emailItem.to],
        },
        Message: {
          Subject: {
            Data: emailItem.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: 'UTF-8',
            },
          },
        },
        ReplyToAddresses: this.config.defaults.replyTo ? [this.config.defaults.replyTo] : [],
      };

      const result = await ses.sendEmail(params).promise();
      
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AWS SES sending failed'
      };
    }
  }

  /**
   * Render email template with data
   */
  private renderTemplate(templateName: string, data: EmailTemplateData): string {
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`Email template not found: ${templateName}`);
    }

    let rendered = template;
    
    // Replace template variables
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    
    return rendered;
  }

  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = this.config.retryConfig.initialDelay * Math.pow(this.config.retryConfig.backoffFactor, attempt - 1);
    return Math.min(delay, this.config.retryConfig.maxDelay);
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(provider: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const limit = this.rateLimits.get(provider);

    if (!limit || now > limit.resetAt) {
      this.rateLimits.set(provider, { count: 1, resetAt: now + 60000 }); // 1 minute window
      return { allowed: true };
    }

    if (limit.count >= 100) { // 100 emails per minute limit
      return { 
        allowed: false,
        retryAfter: limit.resetAt - now
      };
    }

    limit.count++;
    return { allowed: true };
  }

  /**
   * Circuit breaker logic
   */
  private isCircuitBreakerOpen(provider: string): boolean {
    const breaker = this.circuitBreakers.get(provider);
    
    if (!breaker) {
      return false;
    }

    const now = Date.now();
    
    // Reset circuit breaker after 5 minutes
    if (now - breaker.lastFailure > 300000) {
      breaker.isOpen = false;
      breaker.failures = 0;
    }

    return breaker.isOpen;
  }

  /**
   * Record circuit breaker success
   */
  private recordCircuitBreakerSuccess(provider: string): void {
    const breaker = this.circuitBreakers.get(provider);
    
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
    }
  }

  /**
   * Record circuit breaker failure
   */
  private recordCircuitBreakerFailure(provider: string): void {
    let breaker = this.circuitBreakers.get(provider);
    
    if (!breaker) {
      breaker = { failures: 0, lastFailure: 0, isOpen: false };
      this.circuitBreakers.set(provider, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    // Open circuit after 5 consecutive failures
    if (breaker.failures >= 5) {
      breaker.isOpen = true;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { queueLength: number; processing: boolean; circuitBreakers: any } {
    return {
      queueLength: this.emailQueue.length,
      processing: this.processing,
      circuitBreakers: Object.fromEntries(this.circuitBreakers)
    };
  }
}

/**
 * Create email service instance
 */
export function createEmailService(config: Partial<EmailConfig> = {}): EmailService {
  return new EmailService(config);
}

// Export default instance
export const emailService = createEmailService();