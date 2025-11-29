import nodemailer from 'nodemailer';
import { prisma } from '@cryb/database';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isEnabled: boolean;
  private provider: 'smtp' | 'resend';
  private resendApiKey: string | undefined;

  constructor() {
    this.isEnabled = process.env.EMAIL_ENABLED === 'true';
    this.provider = (process.env.EMAIL_PROVIDER as 'smtp' | 'resend') || 'smtp';
    this.resendApiKey = process.env.RESEND_API_KEY;

    if (this.isEnabled) {
      if (this.provider === 'resend' && this.resendApiKey) {
        console.log('✅ Email service using Resend API');
      } else if (this.provider === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.ethereal.email',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        this.verifyConnection();
      } else {
        console.log('⚠️ Email provider not configured, running in DEV mode');
        this.isEnabled = false;
      }
    }
  }

  private async verifyConnection() {
    if (!this.transporter) return;

    try {
      await this.transporter.verify();
      console.log('✅ SMTP service connected successfully');
    } catch (error) {
      console.error('❌ SMTP service connection failed:', error);
      this.isEnabled = false;
    }
  }

  private async sendWithResend(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'CRYB Platform <noreply@cryb.ai>',
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Resend API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
      return false;
    }
  }

  private getVerificationTemplate(username: string, token: string): EmailTemplate {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    
    return {
      subject: 'Verify your CRYB account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to CRYB, ${username}!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
            Verify Email
          </a>
          <p style="margin-top: 20px;">Or copy this link: ${verificationUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link expires in 24 hours.</p>
        </div>
      `,
      text: `Welcome to CRYB, ${username}! Please verify your email: ${verificationUrl}`
    };
  }

  private getPasswordResetTemplate(username: string, token: string): EmailTemplate {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    return {
      subject: 'Reset your CRYB password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${username},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
          <p style="margin-top: 20px;">Or copy this link: ${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      `,
      text: `Password reset requested for ${username}. Reset your password: ${resetUrl}`
    };
  }

  private getNotificationTemplate(username: string, notification: any): EmailTemplate {
    return {
      subject: `CRYB: ${notification.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${username},</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
            <h3>${notification.title}</h3>
            <p>${notification.message}</p>
            ${notification.actionUrl ? `
              <a href="${notification.actionUrl}" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
                View Details
              </a>
            ` : ''}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You received this email because you have notifications enabled for your CRYB account.
          </p>
        </div>
      `,
      text: `${notification.title}: ${notification.message}`
    };
  }

  async sendVerificationEmail(email: string, username: string, token: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`📧 [DEV MODE] Verification email for ${email}: Token=${token}`);
      return true;
    }

    try {
      const template = this.getVerificationTemplate(username, token);

      if (this.provider === 'resend') {
        const success = await this.sendWithResend(email, template.subject, template.html);
        if (!success) throw new Error('Resend API failed');
      } else {
        if (!this.transporter) {
          throw new Error('SMTP transporter not initialized');
        }

        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || 'CRYB Platform <noreply@cryb.ai>',
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });
      }

      await prisma.emailLog.create({
        data: {
          to: email,
          type: 'VERIFICATION',
          status: 'SENT',
          sentAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);

      await prisma.emailLog.create({
        data: {
          to: email,
          type: 'VERIFICATION',
          status: 'FAILED',
          error: (error as Error).message,
          sentAt: new Date()
        }
      });

      return false;
    }
  }

  async sendPasswordResetEmail(email: string, username: string, token: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`🔐 [DEV MODE] Password reset email for ${email}: Token=${token}`);
      return true;
    }

    try {
      const template = this.getPasswordResetTemplate(username, token);

      if (this.provider === 'resend') {
        return await this.sendWithResend(email, template.subject, template.html);
      }

      if (!this.transporter) {
        console.error('SMTP transporter not initialized');
        return false;
      }

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'CRYB Platform <noreply@cryb.ai>',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  async sendNotificationEmail(email: string, username: string, notification: any): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`🔔 [DEV MODE] Notification email for ${email}:`, notification);
      return true;
    }

    try {
      const template = this.getNotificationTemplate(username, notification);
      
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'CRYB Platform <noreply@cryb.ai>',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return true;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  }

  async sendBulkEmails(recipients: Array<{email: string, username: string}>, notification: any): Promise<void> {
    if (!this.isEnabled) {
      console.log(`📬 [DEV MODE] Bulk email to ${recipients.length} recipients`);
      return;
    }

    const results = await Promise.allSettled(
      recipients.map(r => this.sendNotificationEmail(r.email, r.username, notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Bulk email sent: ${successful}/${recipients.length} successful`);
  }
}

export const emailService = new EmailService();