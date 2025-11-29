import nodemailer from 'nodemailer';
import { prisma } from '@cryb/database';
import crypto from 'crypto';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'noreply@cryb.app',
        pass: process.env.SMTP_PASSWORD || 'dummy-password'
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"CRYB Platform" <noreply@cryb.app>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '')
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      // In production, you might want to queue failed emails for retry
    }
  }

  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token in database
    await prisma.emailVerification.create({
      data: {
        userId,
        email,
        token,
        expiresAt: expires
      }
    });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to CRYB Platform!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for signing up! Please click the button below to verify your email address and activate your account.</p>
              <center>
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </center>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with CRYB Platform, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 CRYB Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify your CRYB Platform account',
      html
    });
  }

  async sendPasswordResetEmail(userId: string, email: string): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId,
        token,
        expiresAt: expires
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 CRYB Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset your CRYB Platform password',
      html
    });
  }

  async sendNotificationEmail(userId: string, email: string, notification: any): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .notification { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Notification</h1>
            </div>
            <div class="content">
              <div class="notification">
                <h3>${notification.title}</h3>
                <p>${notification.content}</p>
                <small style="color: #666;">Received at ${new Date(notification.createdAt).toLocaleString()}</small>
              </div>
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/notifications" class="button">View All Notifications</a>
              </center>
              <p style="font-size: 14px; color: #666;">
                You're receiving this email because you have notifications enabled for your CRYB Platform account.
                You can manage your notification preferences in your account settings.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2024 CRYB Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `CRYB Platform: ${notification.title}`,
      html
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to CRYB Platform, ${username}!</h1>
            </div>
            <div class="content">
              <h2>Your account is ready!</h2>
              <p>Thank you for verifying your email. Your CRYB Platform account is now fully activated.</p>
              
              <h3>What you can do now:</h3>
              <div class="feature">
                <strong>Join Communities</strong>
                <p>Discover and join communities that match your interests</p>
              </div>
              <div class="feature">
                <strong>Create Posts</strong>
                <p>Share your thoughts, ideas, and content with the community</p>
              </div>
              <div class="feature">
                <strong>Connect with Others</strong>
                <p>Follow users, send messages, and build your network</p>
              </div>
              <div class="feature">
                <strong>Voice & Video Chat</strong>
                <p>Join voice channels and video calls with community members</p>
              </div>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard" class="button">Go to Dashboard</a>
              </center>
            </div>
            <div class="footer">
              <p>&copy; 2024 CRYB Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Welcome to CRYB Platform, ${username}!`,
      html
    });
  }
}

export const emailService = new EmailService();