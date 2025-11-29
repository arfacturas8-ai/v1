// API smoke tests to validate basic imports and functionality

describe('API Endpoint Smoke Tests', () => {
  describe('Health Route', () => {
    test('should import health route successfully', async () => {
      const healthModule = await import('../src/routes/health');
      expect(healthModule).toBeDefined();
      expect(typeof healthModule.default).toBe('function');
    });
  });

  describe('Analytics Route', () => {
    test('should import analytics route successfully', async () => {
      const analyticsModule = await import('../src/routes/analytics');
      expect(analyticsModule).toBeDefined();
      expect(typeof analyticsModule.default).toBe('function');
    });
  });

  describe('Notifications Route', () => {
    test('should import notifications route successfully', async () => {
      const notificationsModule = await import('../src/routes/notifications');
      expect(notificationsModule).toBeDefined();
      expect(typeof notificationsModule.default).toBe('function');
    });
  });

  describe('Error Handler Middleware', () => {
    test('should import error handler', async () => {
      const { throwBadRequest, throwUnauthorized, throwConflict, throwNotFound, AppError } = 
        await import('../src/middleware/errorHandler');
      
      expect(throwBadRequest).toBeDefined();
      expect(throwUnauthorized).toBeDefined();
      expect(throwConflict).toBeDefined();
      expect(throwNotFound).toBeDefined();
      expect(AppError).toBeDefined();
      
      // Test AppError creation
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error).toHaveProperty('statusCode', 400);
    });

    test('should create different error types', async () => {
      const { throwBadRequest, throwUnauthorized, throwConflict, throwNotFound } = 
        await import('../src/middleware/errorHandler');
      
      expect(() => throwBadRequest('Bad request')).toThrow('Bad request');
      expect(() => throwUnauthorized('Unauthorized')).toThrow('Unauthorized');
      expect(() => throwConflict('Conflict')).toThrow('Conflict');
      expect(() => throwNotFound('Not found')).toThrow('Not found');
    });
  });

  describe('Analytics Service', () => {
    test('should import analytics service', async () => {
      const analyticsModule = await import('../src/services/analytics');
      expect(analyticsModule.AnalyticsService).toBeDefined();
      expect(typeof analyticsModule.AnalyticsService).toBe('function');
    });
  });

  describe('Email Service', () => {
    test('should import email service', async () => {
      const emailModule = await import('../src/services/email-service');
      expect(emailModule.EmailService).toBeDefined();
      expect(typeof emailModule.EmailService).toBe('function');
    });

    test('should create email service instance', async () => {
      const { EmailService } = await import('../src/services/email-service');
      const emailService = new EmailService();
      expect(emailService).toBeInstanceOf(EmailService);
    });
  });

  describe('Notifications Service', () => {
    test('should import notifications service', async () => {
      const notificationsModule = await import('../src/services/notifications');
      expect(notificationsModule.NotificationService).toBeDefined();
      expect(typeof notificationsModule.NotificationService).toBe('function');
    });
  });

  describe('Validation Middleware', () => {
    test('should import validation functions', async () => {
      const validationModule = await import('../src/middleware/validation');
      expect(validationModule.validate).toBeDefined();
      expect(validationModule.validationSchemas).toBeDefined();
      expect(typeof validationModule.validate).toBe('function');
      expect(typeof validationModule.validationSchemas).toBe('object');
    });
  });

  describe('Request Logger Middleware', () => {
    test('should import request logger', async () => {
      const loggerModule = await import('../src/middleware/requestLogger');
      expect(loggerModule.requestLogger).toBeDefined();
      expect(typeof loggerModule.requestLogger).toBe('function');
    });
  });

  describe('Logger Utils', () => {
    test('should import logger utility', async () => {
      const loggerModule = await import('../src/utils/logger');
      expect(loggerModule).toBeDefined();
    });
  });

  describe('Config Modules', () => {
    test('should import server config', async () => {
      const configModule = await import('../src/config/server.config');
      expect(configModule).toBeDefined();
    });
  });
});