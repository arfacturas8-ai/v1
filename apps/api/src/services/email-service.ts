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
    // Email verification template - Mobile-optimized & cross-client compatible
    this.templates.set('verification', `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="x-apple-disable-message-reformatting">
    <title>Verify Your Email - CRYB</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFAFA;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">
                    <!-- Header with gradient -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%); background-color: #58a6ff; padding: 48px 40px; border-radius: 20px 20px 0 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:100px;v-text-anchor:middle;width:600px;" arcsize="0%" stroke="f" fillcolor="#58a6ff">
                            <w:anchorlock/>
                            <center>
                            <![endif]-->
                            <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; color: #FFFFFF; line-height: 1.2;">Welcome to CRYB! 🎉</h1>
                            <!--[if mso]>
                            </center>
                            </v:roundrect>
                            <![endif]-->
                        </td>
                    </tr>

                    <!-- Main content -->
                    <tr>
                        <td style="background-color: #FFFFFF; padding: 48px 40px; border-radius: 0 0 20px 20px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 24px;">
                                        <h2 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; color: #1A1A1A; line-height: 1.3;">Verify Your Email Address</h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1A1A1A; padding-bottom: 16px;">
                                        Hi <strong>{{username}}</strong>,
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #666666; padding-bottom: 32px;">
                                        Thanks for joining CRYB! Please verify your email address to complete your registration and start connecting with friends and communities.
                                    </td>
                                </tr>
                                <!-- Button -->
                                <tr>
                                    <td align="center" style="padding: 32px 0;">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{verificationUrl}}" style="height:56px;v-text-anchor:middle;width:280px;" arcsize="36%" strokecolor="#58a6ff" fillcolor="#58a6ff">
                                        <w:anchorlock/>
                                        <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Verify Email Address</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <a href="{{verificationUrl}}" style="display: inline-block; background: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%); background-color: #58a6ff; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 20px; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3); -webkit-text-size-adjust: none; mso-hide: all;">
                                            Verify Email Address →
                                        </a>
                                        <!--<![endif]-->
                                    </td>
                                </tr>
                                <!-- Link fallback -->
                                <tr>
                                    <td style="padding-top: 24px; border-top: 1px solid #E8EAED;">
                                        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #666666;">
                                            If the button doesn't work, copy and paste this link:
                                        </p>
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #58a6ff; word-break: break-all;">
                                            {{verificationUrl}}
                                        </p>
                                    </td>
                                </tr>
                                <!-- Security notice -->
                                <tr>
                                    <td style="padding-top: 32px; border-top: 1px solid #E8EAED; margin-top: 32px;">
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #999999;">
                                            🔒 This verification link will expire in <strong>{{expirationHours}} hours</strong>. If you didn't create an account with CRYB, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 32px 20px;">
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #999999; line-height: 1.5;">
                                &copy; {{year}} CRYB. All rights reserved.<br>
                                <a href="https://platform.cryb.ai" style="color: #58a6ff; text-decoration: none;">platform.cryb.ai</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim());

    // Password reset template - Mobile-optimized & cross-client compatible
    this.templates.set('password-reset', `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="x-apple-disable-message-reformatting">
    <title>Reset Your Password - CRYB</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFAFA;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">
                    <!-- Header with gradient -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%); background-color: #58a6ff; padding: 48px 40px; border-radius: 20px 20px 0 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:100px;v-text-anchor:middle;width:600px;" arcsize="0%" stroke="f" fillcolor="#58a6ff">
                            <w:anchorlock/>
                            <center>
                            <![endif]-->
                            <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; color: #FFFFFF; line-height: 1.2;">Password Reset 🔐</h1>
                            <!--[if mso]>
                            </center>
                            </v:roundrect>
                            <![endif]-->
                        </td>
                    </tr>

                    <!-- Main content -->
                    <tr>
                        <td style="background-color: #FFFFFF; padding: 48px 40px; border-radius: 0 0 20px 20px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 24px;">
                                        <h2 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; color: #1A1A1A; line-height: 1.3;">Reset Your Password</h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1A1A1A; padding-bottom: 16px;">
                                        Hi <strong>{{username}}</strong>,
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #666666; padding-bottom: 32px;">
                                        We received a request to reset your password for your CRYB account. Click the button below to set a new password.
                                    </td>
                                </tr>
                                <!-- Button -->
                                <tr>
                                    <td align="center" style="padding: 32px 0;">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{resetUrl}}" style="height:56px;v-text-anchor:middle;width:220px;" arcsize="36%" strokecolor="#58a6ff" fillcolor="#58a6ff">
                                        <w:anchorlock/>
                                        <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Reset Password</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <a href="{{resetUrl}}" style="display: inline-block; background: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%); background-color: #58a6ff; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 20px; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3); -webkit-text-size-adjust: none; mso-hide: all;">
                                            Reset Password →
                                        </a>
                                        <!--<![endif]-->
                                    </td>
                                </tr>
                                <!-- Link fallback -->
                                <tr>
                                    <td style="padding-top: 24px; border-top: 1px solid #E8EAED;">
                                        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #666666;">
                                            If the button doesn't work, copy and paste this link:
                                        </p>
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #58a6ff; word-break: break-all;">
                                            {{resetUrl}}
                                        </p>
                                    </td>
                                </tr>
                                <!-- Security notice -->
                                <tr>
                                    <td style="padding-top: 32px; border-top: 1px solid #E8EAED; margin-top: 32px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="background-color: #FFF9F5; border-left: 4px solid #FF9F43; padding: 16px; border-radius: 8px;">
                                                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #666666;">
                                                        ⚠️ This password reset link will expire in <strong>{{expirationHours}} hour</strong>. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 32px 20px;">
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #999999; line-height: 1.5;">
                                &copy; {{year}} CRYB. All rights reserved.<br>
                                <a href="https://platform.cryb.ai" style="color: #58a6ff; text-decoration: none;">platform.cryb.ai</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim());

    // Welcome template - Mobile-optimized & cross-client compatible
    this.templates.set('welcome', `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="x-apple-disable-message-reformatting">
    <title>Welcome to CRYB!</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFAFA;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">
                    <!-- Header with gradient -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%); background-color: #58a6ff; padding: 48px 40px; border-radius: 20px 20px 0 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:100px;v-text-anchor:middle;width:600px;" arcsize="0%" stroke="f" fillcolor="#58a6ff">
                            <w:anchorlock/>
                            <center>
                            <![endif]-->
                            <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; color: #FFFFFF; line-height: 1.2;">You're All Set! 🚀</h1>
                            <!--[if mso]>
                            </center>
                            </v:roundrect>
                            <![endif]-->
                        </td>
                    </tr>

                    <!-- Main content -->
                    <tr>
                        <td style="background-color: #FFFFFF; padding: 48px 40px; border-radius: 0 0 20px 20px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 24px;">
                                        <h2 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; color: #1A1A1A; line-height: 1.3;">Welcome to CRYB!</h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1A1A1A; padding-bottom: 16px;">
                                        Hi <strong>{{username}}</strong>,
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #666666; padding-bottom: 32px;">
                                        Your email has been verified and your CRYB account is now active! You can now start connecting with friends, joining communities, and exploring everything CRYB has to offer.
                                    </td>
                                </tr>
                                <!-- What's Next Card -->
                                <tr>
                                    <td style="padding: 24px 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="background-color: #F8F9FA; border-left: 4px solid #58a6ff; padding: 24px; border-radius: 12px;">
                                                    <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1A1A1A;">What's Next?</h3>
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.8; color: #666666; padding: 4px 0;">
                                                                ✨ Complete your profile setup
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.8; color: #666666; padding: 4px 0;">
                                                                👥 Discover and join communities
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.8; color: #666666; padding: 4px 0;">
                                                                💬 Start chatting with friends
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.8; color: #666666; padding: 4px 0;">
                                                                🎨 Customize your experience
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Button -->
                                <tr>
                                    <td align="center" style="padding: 32px 0;">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{appUrl}}" style="height:56px;v-text-anchor:middle;width:200px;" arcsize="36%" strokecolor="#58a6ff" fillcolor="#58a6ff">
                                        <w:anchorlock/>
                                        <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Get Started</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <a href="{{appUrl}}" style="display: inline-block; background: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%); background-color: #58a6ff; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 20px; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3); -webkit-text-size-adjust: none; mso-hide: all;">
                                            Get Started →
                                        </a>
                                        <!--<![endif]-->
                                    </td>
                                </tr>
                                <!-- Help text -->
                                <tr>
                                    <td style="padding-top: 32px; border-top: 1px solid #E8EAED; margin-top: 32px;">
                                        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #999999; text-align: center;">
                                            Need help getting started? <a href="https://platform.cryb.ai/help" style="color: #58a6ff; text-decoration: none;">Visit our Help Center</a> or reach out to our support team.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 32px 20px;">
                            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #999999; line-height: 1.5;">
                                &copy; {{year}} CRYB. All rights reserved.<br>
                                <a href="https://platform.cryb.ai" style="color: #58a6ff; text-decoration: none;">platform.cryb.ai</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim());

    // Notification digest template
    this.templates.set('notification-digest', `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="x-apple-disable-message-reformatting">
    <title>Your CRYB Notifications</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFAFA;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">

                    <!-- Header with brand gradient -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%); background-color: #58a6ff; padding: 48px 40px; border-radius: 20px 20px 0 0;">
                            <!--[if mso]>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                            <td align="center">
                            <![endif]-->
                            <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; line-height: 1.2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                🔔 {{notificationCount}} New Notifications
                            </h1>
                            <!--[if mso]>
                            </td>
                            </tr>
                            </table>
                            <![endif]-->
                        </td>
                    </tr>

                    <!-- Content Section -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <!--[if mso]>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                            <td>
                            <![endif]-->

                            <!-- Greeting -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 24px;">
                                        <p style="margin: 0; font-size: 17px; line-height: 1.6; color: #1A1A1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            Hi <strong style="color: #1A1A1A;">{{username}}</strong>,
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 32px;">
                                        <p style="margin: 0; font-size: 17px; line-height: 1.6; color: #666666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            You have <strong style="color: #58a6ff;">{{notificationCount}} new notifications</strong> waiting for you on CRYB:
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Notifications List -->
                            {{#notifications}}
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                                <tr>
                                    <td style="background-color: #F8F9FA; border-left: 4px solid #58a6ff; padding: 20px; border-radius: 12px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 8px;">
                                                    <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #1A1A1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                                        {{title}}
                                                    </h4>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 8px;">
                                                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #666666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                                        {{content}}
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; font-size: 13px; color: #999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                                        {{timeAgo}}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            {{/notifications}}

                            <!-- CTA Button -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
                                <tr>
                                    <td align="center">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{notificationsUrl}}" style="height:56px;v-text-anchor:middle;width:300px;" arcsize="36%" strokecolor="#58a6ff" fillcolor="#58a6ff">
                                        <w:anchorlock/>
                                        <center style="color:#ffffff;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:600;">View All Notifications →</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <a href="{{notificationsUrl}}" style="display: inline-block; background: linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%); background-color: #58a6ff; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3);">
                                            View All Notifications →
                                        </a>
                                        <!--<![endif]-->
                                    </td>
                                </tr>
                            </table>

                            <!-- Unsubscribe Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #E8EAED;">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            Too many emails?
                                            <a href="{{unsubscribeUrl}}" style="color: #58a6ff; text-decoration: none; font-weight: 500;">
                                                Manage your notification preferences
                                            </a>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!--[if mso]>
                            </td>
                            </tr>
                            </table>
                            <![endif]-->
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F8F9FA; padding: 32px 40px; border-radius: 0 0 20px 20px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 8px;">
                                        <p style="margin: 0; font-size: 13px; color: #999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            Made with ❤️ by the CRYB Team
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0; font-size: 13px; color: #CCCCCC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                                            &copy; {{year}} CRYB. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                <!-- End Main Container -->
            </td>
        </tr>
    </table>
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