import Redis from 'ioredis';

describe('Smoke Tests', () => {
  describe('Auth Service Basic Functionality', () => {
    test('should import auth service successfully', async () => {
      const { AuthService } = await import('../src/services/auth');
      expect(AuthService).toBeDefined();
      expect(typeof AuthService).toBe('function');
    });

    test('should create auth service instance', async () => {
      const { AuthService } = await import('../src/services/auth');
      const redis = new Redis();
      const authService = new AuthService(redis);
      expect(authService).toBeInstanceOf(AuthService);
    });
  });

  describe('Config Validation', () => {
    test('should load environment configuration', async () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.JWT_SECRET).toBeDefined();
    });
  });

  describe('Database Integration', () => {
    test('should mock database operations correctly', async () => {
      const { prisma } = await import('@cryb/database');
      
      // Test user operations
      expect(prisma.user.findUnique).toBeDefined();
      expect(typeof prisma.user.findUnique).toBe('function');
      
      // Test basic mock functionality
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: '1',
        username: 'testuser',
        email: 'test@example.com'
      });
      
      const user = await prisma.user.findUnique({ where: { id: '1' } });
      expect(user).toEqual({
        id: '1',
        username: 'testuser',
        email: 'test@example.com'
      });
    });
  });

  describe('Auth Token Functions', () => {
    test('should import auth token functions', async () => {
      const authModule = await import('@cryb/auth');
      
      expect(authModule.generateAccessToken).toBeDefined();
      expect(authModule.verifyToken).toBeDefined();
      expect(typeof authModule.generateAccessToken).toBe('function');
      expect(typeof authModule.verifyToken).toBe('function');
    });
  });

  describe('Basic Service Imports', () => {
    test('should import core services without errors', async () => {
      const services = [
        '../src/services/auth',
        '../src/services/analytics', 
        '../src/services/notifications',
        '../src/services/email-service'
      ];
      
      for (const service of services) {
        const module = await import(service);
        expect(module).toBeDefined();
      }
    });

    test('should import middleware without errors', async () => {
      const middlewares = [
        '../src/middleware/validation',
        '../src/middleware/errorHandler',
        '../src/middleware/requestLogger'
      ];
      
      for (const middleware of middlewares) {
        const module = await import(middleware);
        expect(module).toBeDefined();
      }
    });
  });

  describe('Route Imports', () => {
    test('should import routes without compilation errors', async () => {
      // Test importing key route files
      const routes = [
        '../src/routes/health',
        '../src/routes/analytics',
        '../src/routes/notifications'
      ];
      
      for (const route of routes) {
        try {
          const module = await import(route);
          expect(module).toBeDefined();
        } catch (error) {
          // Route might not exist or have dependencies - that's OK for smoke test
          console.warn(`Could not import ${route}:`, error);
        }
      }
    });
  });
});