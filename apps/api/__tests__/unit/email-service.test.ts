// @jest imports are available globally
import { EmailService } from '../../src/services/email-service';
import { mockDb } from '../setup';

// Mock nodemailer
const mockTransporter = {
  sendMail: jest.fn(),
  verify: jest.fn(),
  close: jest.fn()
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter)
}));

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'testpass'
      }
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await emailService.close();
  });

  describe('sendEmail', () => {
    test('should send basic email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK'
      });

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test plain text content'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test plain text content',
        from: expect.any(String)
      });
    });

    test('should handle multiple recipients', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK'
      });

      await emailService.sendEmail({
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Subject',
        text: 'Test content'
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['recipient1@example.com', 'recipient2@example.com']
        })
      );
    });

    test('should include CC and BCC recipients', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK'
      });

      await emailService.sendEmail({
        to: 'recipient@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Subject',
        text: 'Test content'
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: 'cc@example.com',
          bcc: 'bcc@example.com'
        })
      );
    });

    test('should handle attachments', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK'
      });

      const attachments = [
        {
          filename: 'test.pdf',
          content: Buffer.from('test content'),
          contentType: 'application/pdf'
        }
      ];

      await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test with Attachment',
        text: 'Test content',
        attachments
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments
        })
      );
    });

    test('should handle send failures', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test content'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
    });

    test('should validate email addresses', async () => {
      const result = await emailService.sendEmail({
        to: 'invalid-email',
        subject: 'Test Subject',
        text: 'Test content'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
    });

    test('should require either text or html content', async () => {
      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject'
        // No text or html content
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('content required');
    });
  });

  describe('sendWelcomeEmail', () => {
    test('should send welcome email with user details', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'welcome-message-id',
        response: '250 OK'
      });

      const result = await emailService.sendWelcomeEmail(
        'newuser@example.com',
        'NewUser',
        'http://example.com/verify?token=abc123'
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@example.com',
          subject: expect.stringContaining('Welcome'),
          html: expect.stringContaining('NewUser'),
          html: expect.stringContaining('abc123')
        })
      );
    });

    test('should handle missing verification link', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'welcome-message-id',
        response: '250 OK'
      });

      await emailService.sendWelcomeEmail(
        'newuser@example.com',
        'NewUser'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.not.stringContaining('verify')
        })
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    test('should send password reset email', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'reset-message-id',
        response: '250 OK'
      });

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123',
        60 // expires in 60 minutes
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Reset'),
          html: expect.stringContaining('reset-token-123'),
          html: expect.stringContaining('60 minutes')
        })
      );
    });

    test('should include security warning', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'reset-message-id',
        response: '250 OK'
      });

      await emailService.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('did not request')
        })
      );
    });
  });

  describe('sendVerificationEmail', () => {
    test('should send email verification', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'verify-message-id',
        response: '250 OK'
      });

      const result = await emailService.sendVerificationEmail(
        'user@example.com',
        'verify-token-123'
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Verify'),
          html: expect.stringContaining('verify-token-123')
        })
      );
    });
  });

  describe('sendNotificationEmail', () => {
    test('should send notification email', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'notification-message-id',
        response: '250 OK'
      });

      const result = await emailService.sendNotificationEmail(
        'user@example.com',
        'New Message',
        'You have received a new message from John Doe',
        'http://example.com/messages/123'
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('New Message'),
          html: expect.stringContaining('John Doe'),
          html: expect.stringContaining('messages/123')
        })
      );
    });

    test('should handle notification without action link', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'notification-message-id',
        response: '250 OK'
      });

      await emailService.sendNotificationEmail(
        'user@example.com',
        'System Update',
        'System maintenance completed'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.not.stringContaining('href')
        })
      );
    });
  });

  describe('sendBulkEmail', () => {
    test('should send emails to multiple recipients', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'bulk-message-id',
        response: '250 OK'
      });

      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ];

      const result = await emailService.sendBulkEmail({
        recipients,
        subject: 'Bulk Announcement',
        text: 'Important announcement',
        html: '<p>Important announcement</p>'
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });

    test('should handle partial failures in bulk email', async () => {
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'msg1' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ messageId: 'msg3' });

      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ];

      const result = await emailService.sendBulkEmail({
        recipients,
        subject: 'Bulk Announcement',
        text: 'Important announcement'
      });

      expect(result.success).toBe(true); // Overall success despite one failure
      expect(result.results).toHaveLength(3);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[2].success).toBe(true);
    });

    test('should respect rate limiting for bulk emails', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg' });

      const recipients = new Array(100).fill(0).map((_, i) => `user${i}@example.com`);

      const startTime = Date.now();
      await emailService.sendBulkEmail({
        recipients,
        subject: 'Bulk Test',
        text: 'Test content',
        rateLimit: 10 // 10 emails per second
      });
      const endTime = Date.now();

      // Should take at least 9 seconds to send 100 emails at 10/sec
      expect(endTime - startTime).toBeGreaterThan(9000);
    });
  });

  describe('verifyConnection', () => {
    test('should verify SMTP connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.verifyConnection();

      expect(result.success).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    test('should handle connection verification failure', async () => {
      const error = new Error('Connection refused');
      mockTransporter.verify.mockRejectedValue(error);

      const result = await emailService.verifyConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });
  });

  describe('getEmailStats', () => {
    test('should return email statistics', async () => {
      mockDb.emailLog.aggregate.mockResolvedValue([
        {
          _count: { id: 100 },
          _sum: { attempts: 105 }
        }
      ]);

      mockDb.emailLog.count.mockResolvedValue(95); // 95 successful

      const stats = await emailService.getEmailStats('24h');

      expect(stats).toEqual(
        expect.objectContaining({
          totalSent: 100,
          successfulSent: 95,
          failedSent: 5,
          successRate: 0.95,
          totalAttempts: 105
        })
      );
    });

    test('should handle different time periods', async () => {
      mockDb.emailLog.aggregate.mockResolvedValue([{ _count: { id: 0 } }]);
      mockDb.emailLog.count.mockResolvedValue(0);

      await emailService.getEmailStats('7d');
      await emailService.getEmailStats('30d');

      expect(mockDb.emailLog.aggregate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Template System', () => {
    test('should render email template with variables', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'template-message-id'
      });

      const result = await emailService.sendTemplateEmail({
        to: 'user@example.com',
        templateName: 'welcome',
        variables: {
          username: 'John',
          verificationLink: 'http://example.com/verify/123'
        }
      });

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('John'),
          html: expect.stringContaining('verify/123')
        })
      );
    });

    test('should handle missing template', async () => {
      const result = await emailService.sendTemplateEmail({
        to: 'user@example.com',
        templateName: 'non-existent',
        variables: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template not found');
    });

    test('should validate required template variables', async () => {
      const result = await emailService.sendTemplateEmail({
        to: 'user@example.com',
        templateName: 'welcome',
        variables: {
          // Missing required 'username' variable
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required');
    });
  });

  describe('Queue Integration', () => {
    test('should queue email for later delivery', async () => {
      const result = await emailService.queueEmail({
        to: 'user@example.com',
        subject: 'Queued Email',
        text: 'This will be sent later',
        scheduleFor: new Date(Date.now() + 3600000) // 1 hour from now
      });

      expect(result.success).toBe(true);
      expect(result.queuedAt).toBeDefined();
      expect(result.scheduleFor).toBeDefined();
    });

    test('should process queued emails', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'queued-msg' });

      const queuedEmails = [
        {
          id: '1',
          to: 'user1@example.com',
          subject: 'Queued 1',
          text: 'Content 1'
        },
        {
          id: '2',
          to: 'user2@example.com',
          subject: 'Queued 2',
          text: 'Content 2'
        }
      ];

      mockDb.emailQueue.findMany.mockResolvedValue(queuedEmails);
      mockDb.emailQueue.delete.mockResolvedValue({});

      const result = await emailService.processQueue();

      expect(result.processed).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    test('should retry failed emails', async () => {
      mockTransporter.sendMail
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ messageId: 'retry-success' });

      const result = await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Retry Test',
        text: 'Test content'
      }, { retries: 1 });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('retry-success');
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });

    test('should give up after max retries', async () => {
      mockTransporter.sendMail
        .mockRejectedValue(new Error('Persistent failure'));

      const result = await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Max Retry Test',
        text: 'Test content'
      }, { retries: 3 });

      expect(result.success).toBe(false);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('Resource Management', () => {
    test('should properly close connections', async () => {
      await emailService.close();
      
      expect(mockTransporter.close).toHaveBeenCalled();
    });

    test('should handle concurrent email sending', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'concurrent' });

      const promises = Array.from({ length: 50 }, (_, i) =>
        emailService.sendEmail({
          to: `user${i}@example.com`,
          subject: `Concurrent Test ${i}`,
          text: 'Test content'
        })
      );

      const results = await Promise.all(promises);

      expect(results.every(r => r.success)).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(50);
    });
  });
});