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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); border: 1px solid rgba(255, 255, 255, 0.9);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                      <p style="margin: 6px 0 0; color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 500;">Next-Generation Community Platform</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <h2 style="margin: 0 0 12px; color: #1A1A1A; font-size: 22px; font-weight: 600;">Welcome to CRYB, ${username}!</h2>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 15px; line-height: 1.6;">
                        You're just one step away from joining the next-generation community platform where conversations come alive.
                      </p>
                      <p style="margin: 0 0 28px; color: #666666; font-size: 15px; line-height: 1.6;">
                        Click the button below to verify your email address and complete your registration:
                      </p>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.25);">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Alternative Link -->
                      <p style="margin: 28px 0 0; padding: 20px; background: rgba(88, 166, 255, 0.06); border-radius: 12px; color: #666666; font-size: 13px; line-height: 1.6; border: 1px solid rgba(88, 166, 255, 0.12);">
                        Or copy and paste this link into your browser:<br>
                        <span style="color: #58a6ff; word-break: break-all; font-weight: 500;">${verificationUrl}</span>
                      </p>

                      <!-- Security Notice -->
                      <p style="margin: 20px 0 0; color: #999999; font-size: 13px; line-height: 1.5;">
                        This verification link expires in 24 hours for your security.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid rgba(0, 0, 0, 0.06); text-align: center;">
                      <p style="margin: 0 0 6px; color: #999999; font-size: 13px;">
                        © 2024 CRYB Platform. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #CCCCCC; font-size: 12px;">
                        Didn't create this account? You can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Welcome to CRYB, ${username}! Please verify your email: ${verificationUrl}`
    };
  }

  private getPasswordResetTemplate(username: string, token: string): EmailTemplate {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    return {
      subject: 'Reset your CRYB password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); border: 1px solid rgba(255, 255, 255, 0.9);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                      <p style="margin: 6px 0 0; color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 500;">Next-Generation Community Platform</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <h2 style="margin: 0 0 12px; color: #1A1A1A; font-size: 22px; font-weight: 600;">Password Reset Request</h2>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 15px; line-height: 1.6;">
                        Hi ${username},
                      </p>
                      <p style="margin: 0 0 28px; color: #666666; font-size: 15px; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to create a new password for your account:
                      </p>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.25);">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Alternative Link -->
                      <p style="margin: 28px 0 0; padding: 20px; background: rgba(88, 166, 255, 0.06); border-radius: 12px; color: #666666; font-size: 13px; line-height: 1.6; border: 1px solid rgba(88, 166, 255, 0.12);">
                        Or copy and paste this link into your browser:<br>
                        <span style="color: #58a6ff; word-break: break-all; font-weight: 500;">${resetUrl}</span>
                      </p>

                      <!-- Security Notice -->
                      <div style="margin: 24px 0 0; padding: 20px; background: rgba(255, 59, 48, 0.08); border-left: 3px solid #ff3b30; border-radius: 12px;">
                        <p style="margin: 0 0 8px; color: #ff3b30; font-size: 14px; font-weight: 600;">
                          Important Security Information
                        </p>
                        <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.5;">
                          This password reset link expires in 1 hour for your security.<br>
                          If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid rgba(0, 0, 0, 0.06); text-align: center;">
                      <p style="margin: 0 0 6px; color: #999999; font-size: 13px;">
                        © 2024 CRYB Platform. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #CCCCCC; font-size: 12px;">
                        This is an automated security email. Please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Password reset requested for ${username}. Reset your password: ${resetUrl}`
    };
  }

  private getWelcomeTemplate(username: string): EmailTemplate {
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.cryb.ai';

    return {
      subject: 'Welcome to CRYB!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); border: 1px solid rgba(255, 255, 255, 0.9);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                      <p style="margin: 6px 0 0; color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 500;">Next-Generation Community Platform</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <h2 style="margin: 0 0 12px; color: #1A1A1A; font-size: 24px; font-weight: 600;">Welcome to CRYB, ${username}!</h2>
                      <p style="margin: 0 0 24px; color: #666666; font-size: 15px; line-height: 1.6;">
                        Your account is now fully activated! You're now part of a next-generation community platform where conversations come alive and connections are real.
                      </p>

                      <!-- Features Grid -->
                      <div style="margin: 28px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 16px; background: rgba(88, 166, 255, 0.08); border-radius: 12px; border-left: 3px solid #58a6ff;">
                              <p style="margin: 0 0 6px; color: #58a6ff; font-size: 16px; font-weight: 600;">Join Communities</p>
                              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                Discover and join communities that match your interests.
                              </p>
                            </td>
                          </tr>
                          <tr><td style="height: 12px;"></td></tr>
                          <tr>
                            <td style="padding: 16px; background: rgba(163, 113, 247, 0.08); border-radius: 12px; border-left: 3px solid #a371f7;">
                              <p style="margin: 0 0 6px; color: #a371f7; font-size: 16px; font-weight: 600;">Web3 Integration</p>
                              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                Connect your wallet, send tips, and access Web3 features.
                              </p>
                            </td>
                          </tr>
                          <tr><td style="height: 12px;"></td></tr>
                          <tr>
                            <td style="padding: 16px; background: rgba(52, 211, 153, 0.08); border-radius: 12px; border-left: 3px solid #34d399;">
                              <p style="margin: 0 0 6px; color: #34d399; font-size: 16px; font-weight: 600;">Voice & Video</p>
                              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                Join voice channels and connect in real-time.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
                        <tr>
                          <td align="center">
                            <a href="${platformUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.25);">
                              Explore CRYB Now
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Tips -->
                      <div style="margin: 28px 0 0; padding: 20px; background: rgba(88, 166, 255, 0.06); border-radius: 12px; border: 1px solid rgba(88, 166, 255, 0.12);">
                        <p style="margin: 0 0 10px; color: #1A1A1A; font-size: 15px; font-weight: 600;">
                          Quick Tips to Get Started:
                        </p>
                        <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.7;">
                          ✓ Complete your profile and add a profile picture<br>
                          ✓ Explore trending communities and join your favorites<br>
                          ✓ Share your first post and connect with others<br>
                          ✓ Enable notifications to stay updated
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid rgba(0, 0, 0, 0.06); text-align: center;">
                      <p style="margin: 0 0 6px; color: #999999; font-size: 13px;">
                        © 2024 CRYB Platform. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #CCCCCC; font-size: 12px;">
                        You're receiving this email because you created a CRYB account.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Welcome to CRYB, ${username}! Your account is now fully activated. Start exploring communities, connecting with others, and experiencing Web3 features at ${platformUrl}`
    };
  }

  private getPasswordChangedTemplate(username: string): EmailTemplate {
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.cryb.ai';

    return {
      subject: 'Your CRYB password was changed ✅',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1A1A1B 0%, #2A2A2B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #34d399 0%, #10b981 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Next-Generation Community Platform</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Password Successfully Changed ✅</h2>
                      <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                        Hi ${username},
                      </p>
                      <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                        This email confirms that your CRYB account password was successfully changed. You can now use your new password to log in.
                      </p>

                      <!-- Success Message -->
                      <div style="margin: 24px 0; padding: 20px; background: rgba(52, 211, 153, 0.1); border-left: 4px solid #34d399; border-radius: 8px;">
                        <p style="margin: 0 0 8px; color: #34d399; font-size: 14px; font-weight: 600;">
                          ✓ Your account is secure
                        </p>
                        <p style="margin: 0; color: #b4b4b5; font-size: 13px; line-height: 1.5;">
                          Your password has been updated successfully. All existing sessions on other devices remain active.
                        </p>
                      </div>

                      <!-- Security Alert -->
                      <div style="margin: 24px 0; padding: 20px; background: rgba(255, 59, 48, 0.1); border-left: 4px solid #ff3b30; border-radius: 8px;">
                        <p style="margin: 0 0 8px; color: #ff6b6b; font-size: 14px; font-weight: 600;">
                          ⚠️ Didn't make this change?
                        </p>
                        <p style="margin: 0 0 16px; color: #b4b4b5; font-size: 13px; line-height: 1.5;">
                          If you didn't change your password, someone else may have accessed your account. Please secure your account immediately.
                        </p>
                        <a href="${platformUrl}/settings/security" style="display: inline-block; padding: 12px 24px; background: #ff3b30; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
                          Secure My Account
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                      <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                        © 2024 CRYB Platform. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                        This is an automated security email. Please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Your CRYB password was successfully changed. If you didn't make this change, please secure your account immediately at ${platformUrl}/settings/security`
    };
  }

  private getSecurityAlertTemplate(username: string, alertType: string, details: string): EmailTemplate {
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.cryb.ai';

    return {
      subject: `CRYB Security Alert: ${alertType} 🔒`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1A1A1B 0%, #2A2A2B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Security Alert</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Security Alert: ${alertType} 🔒</h2>
                      <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                        Hi ${username},
                      </p>
                      <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                        We detected unusual activity on your CRYB account and wanted to alert you immediately.
                      </p>

                      <!-- Alert Details -->
                      <div style="margin: 24px 0; padding: 20px; background: rgba(255, 59, 48, 0.15); border-left: 4px solid #ff3b30; border-radius: 8px;">
                        <p style="margin: 0 0 8px; color: #ff6b6b; font-size: 14px; font-weight: 600;">
                          ⚠️ What happened:
                        </p>
                        <p style="margin: 0; color: #b4b4b5; font-size: 14px; line-height: 1.6;">
                          ${details}
                        </p>
                      </div>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${platformUrl}/settings/security" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 8px 24px rgba(255, 59, 48, 0.3);">
                              Review Security Settings
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Recommendations -->
                      <div style="margin: 32px 0 0; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 12px;">
                        <p style="margin: 0 0 12px; color: #ffffff; font-size: 16px; font-weight: 600;">
                          Recommended Actions:
                        </p>
                        <p style="margin: 0; color: #b4b4b5; font-size: 14px; line-height: 1.8;">
                          ✓ Review your recent account activity<br>
                          ✓ Change your password immediately<br>
                          ✓ Enable two-factor authentication<br>
                          ✓ Check active sessions and logout unfamiliar devices<br>
                          ✓ Contact support if you need assistance
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                      <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                        © 2024 CRYB Platform. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                        This is an automated security email. Please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `CRYB Security Alert: ${alertType}. ${details}. Please review your security settings at ${platformUrl}/settings/security`
    };
  }

  private getInvitationTemplate(inviterName: string, inviteeEmail: string, invitationCode: string): EmailTemplate {
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.cryb.ai';
    const invitationUrl = `${platformUrl}/signup?invite=${invitationCode}`;

    return {
      subject: `${inviterName} invited you to join CRYB! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1A1A1B 0%, #2A2A2B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Next-Generation Community Platform</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 28px; font-weight: 600;">You're Invited! 🎉</h2>
                      <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                        <strong style="color: #58a6ff;">${inviterName}</strong> has invited you to join <strong style="background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">CRYB</strong> - the next-generation community platform where conversations come alive!
                      </p>

                      <!-- Invitation Card -->
                      <div style="margin: 32px 0; padding: 24px; background: rgba(88, 166, 255, 0.08); border-radius: 12px; border: 1px solid rgba(88, 166, 255, 0.2);">
                        <p style="margin: 0 0 16px; color: #ffffff; font-size: 16px; font-weight: 600; text-align: center;">
                          🌟 What Awaits You on CRYB
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 12px 0;">
                              <p style="margin: 0; color: #b4b4b5; font-size: 14px;">
                                <span style="color: #58a6ff; font-weight: 600;">💬</span> Join vibrant communities and connect with like-minded people
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0;">
                              <p style="margin: 0; color: #b4b4b5; font-size: 14px;">
                                <span style="color: #a371f7; font-weight: 600;">💰</span> Access Web3 features - NFTs, crypto wallets, and token rewards
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0;">
                              <p style="margin: 0; color: #b4b4b5; font-size: 14px;">
                                <span style="color: #34d399; font-weight: 600;">🎤</span> Voice & video calls with real-time conversations
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0;">
                              <p style="margin: 0; color: #b4b4b5; font-size: 14px;">
                                <span style="color: #ff6b6b; font-weight: 600;">🎨</span> Share content, create posts, and express yourself
                              </p>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                        <tr>
                          <td align="center">
                            <a href="${invitationUrl}" style="display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 18px; font-weight: 700; box-shadow: 0 8px 24px rgba(88, 166, 255, 0.4); letter-spacing: 0.5px;">
                              Accept Invitation & Join CRYB
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Alternative Link -->
                      <p style="margin: 32px 0 0; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 8px; color: #7e7e80; font-size: 14px; line-height: 1.6; text-align: center;">
                        Or copy and paste this invitation link:<br>
                        <span style="color: #58a6ff; word-break: break-all; font-size: 13px;">${invitationUrl}</span>
                      </p>

                      <!-- Inviter Info -->
                      <div style="margin: 24px 0 0; padding: 20px; background: rgba(163, 113, 247, 0.1); border-left: 4px solid #a371f7; border-radius: 8px;">
                        <p style="margin: 0; color: #b4b4b5; font-size: 13px; line-height: 1.6;">
                          💡 <strong style="color: #ffffff;">${inviterName}</strong> is already part of the CRYB community and thought you'd love it too. Join them and start exploring!
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                      <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                        © 2024 CRYB Platform. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                        This invitation was sent to ${inviteeEmail}. If you don't want to join, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `${inviterName} invited you to join CRYB! Accept your invitation and join the next-generation community platform: ${invitationUrl}`
    };
  }

  private getNotificationTemplate(username: string, notification: any): EmailTemplate {
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://platform.cryb.ai';

    return {
      subject: `CRYB: ${notification.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1A1A1B 0%, #2A2A2B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Next-Generation Community Platform</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Hi ${username},</h2>
                      <div style="margin: 24px 0; padding: 20px; background: rgba(88, 166, 255, 0.1); border-left: 4px solid #58a6ff; border-radius: 8px;">
                        <p style="margin: 0 0 8px; color: #58a6ff; font-size: 18px; font-weight: 600;">
                          ${notification.title}
                        </p>
                        <p style="margin: 0; color: #b4b4b5; font-size: 15px; line-height: 1.6;">
                          ${notification.message}
                        </p>
                      </div>

                      ${notification.actionUrl ? `
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                          <tr>
                            <td align="center">
                              <a href="${notification.actionUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 6px 20px rgba(88, 166, 255, 0.3);">
                                View Details
                              </a>
                            </td>
                          </tr>
                        </table>
                      ` : ''}

                      <p style="margin: 24px 0 0; color: #7e7e80; font-size: 13px; line-height: 1.5;">
                        You're receiving this email because you have notifications enabled for your CRYB account.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                      <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                        © 2024 CRYB Platform. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                        <a href="${platformUrl}/settings/notifications" style="color: #58a6ff; text-decoration: none;">Manage notification preferences</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `${notification.title}: ${notification.message}${notification.actionUrl ? ` - ${notification.actionUrl}` : ''}`
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

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`🎉 [DEV MODE] Welcome email for ${email}`);
      return true;
    }

    try {
      const template = this.getWelcomeTemplate(username);

      if (this.provider === 'resend') {
        return await this.sendWithResend(email, template.subject, template.html);
      }

      if (!this.transporter) {
        console.error('SMTP transporter not initialized');
        return false;
      }

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'CRYB Platform <therealcryb@gmail.com>',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      await prisma.emailLog.create({
        data: {
          to: email,
          type: 'WELCOME',
          status: 'SENT',
          sentAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);

      await prisma.emailLog.create({
        data: {
          to: email,
          type: 'WELCOME',
          status: 'FAILED',
          error: (error as Error).message,
          sentAt: new Date()
        }
      });

      return false;
    }
  }

  async sendPasswordChangedEmail(email: string, username: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`🔐 [DEV MODE] Password changed email for ${email}`);
      return true;
    }

    try {
      const template = this.getPasswordChangedTemplate(username);

      if (this.provider === 'resend') {
        return await this.sendWithResend(email, template.subject, template.html);
      }

      if (!this.transporter) {
        console.error('SMTP transporter not initialized');
        return false;
      }

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'CRYB Platform <therealcryb@gmail.com>',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return true;
    } catch (error) {
      console.error('Failed to send password changed email:', error);
      return false;
    }
  }

  async sendSecurityAlertEmail(email: string, username: string, alertType: string, details: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`🚨 [DEV MODE] Security alert email for ${email}: ${alertType}`);
      return true;
    }

    try {
      const template = this.getSecurityAlertTemplate(username, alertType, details);

      if (this.provider === 'resend') {
        return await this.sendWithResend(email, template.subject, template.html);
      }

      if (!this.transporter) {
        console.error('SMTP transporter not initialized');
        return false;
      }

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'CRYB Platform <therealcryb@gmail.com>',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      return true;
    } catch (error) {
      console.error('Failed to send security alert email:', error);
      return false;
    }
  }

  async sendInvitationEmail(inviteeEmail: string, inviterName: string, invitationCode: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`🎉 [DEV MODE] Invitation email for ${inviteeEmail} from ${inviterName}`);
      return true;
    }

    try {
      const template = this.getInvitationTemplate(inviterName, inviteeEmail, invitationCode);

      if (this.provider === 'resend') {
        return await this.sendWithResend(inviteeEmail, template.subject, template.html);
      }

      if (!this.transporter) {
        console.error('SMTP transporter not initialized');
        return false;
      }

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'CRYB Platform <therealcryb@gmail.com>',
        to: inviteeEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      await prisma.emailLog.create({
        data: {
          to: inviteeEmail,
          type: 'INVITATION',
          status: 'SENT',
          sentAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to send invitation email:', error);

      await prisma.emailLog.create({
        data: {
          to: inviteeEmail,
          type: 'INVITATION',
          status: 'FAILED',
          error: (error as Error).message,
          sentAt: new Date()
        }
      });

      return false;
    }
  }
}

export const emailService = new EmailService();