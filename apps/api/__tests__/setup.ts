import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock Redis for testing
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn(),
  };
  
  return jest.fn(() => mockRedis);
});

// Mock Elasticsearch
jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn(() => ({
    ping: jest.fn().mockResolvedValue({ body: {} }),
    indices: {
      exists: jest.fn().mockResolvedValue({ body: true }),
      create: jest.fn().mockResolvedValue({ body: {} }),
      delete: jest.fn().mockResolvedValue({ body: {} }),
    },
    search: jest.fn().mockResolvedValue({ body: { hits: { hits: [] } } }),
    index: jest.fn().mockResolvedValue({ body: {} }),
    delete: jest.fn().mockResolvedValue({ body: {} }),
    update: jest.fn().mockResolvedValue({ body: {} }),
  })),
}));

// Mock MinIO
jest.mock('minio', () => ({
  Client: jest.fn(() => ({
    bucketExists: jest.fn().mockResolvedValue(true),
    makeBucket: jest.fn().mockResolvedValue(undefined),
    putObject: jest.fn().mockResolvedValue('etag'),
    removeObject: jest.fn().mockResolvedValue(undefined),
    getObject: jest.fn().mockResolvedValue('stream'),
    presignedGetObject: jest.fn().mockResolvedValue('url'),
    presignedPutObject: jest.fn().mockResolvedValue('url'),
  })),
}));

// Mock Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
    adapter: jest.fn(),
  })),
}));

// Mock Bull/BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn(() => ({
    add: jest.fn().mockResolvedValue({ id: '123' }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock LiveKit
jest.mock('livekit-server-sdk', () => ({
  AccessToken: jest.fn(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn().mockReturnValue('mock-token'),
  })),
  RoomServiceClient: jest.fn(() => ({
    createRoom: jest.fn().mockResolvedValue({ name: 'test-room' }),
    deleteRoom: jest.fn().mockResolvedValue(undefined),
    listRooms: jest.fn().mockResolvedValue([]),
  })),
}));

// Setup global test timeout
jest.setTimeout(15000);

// Global test hooks
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(async () => {
  // Clean up any open handles
  await new Promise(resolve => setImmediate(resolve));
});

// Mock OpenAI for AI features
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI response' } }]
        })
      }
    }
  }))
}));

// Mock crypto modules
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn().mockReturnValue(Buffer.from('mock-random-bytes')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-hash')
  }))
}));

// Mock @cryb/auth package
jest.mock('@cryb/auth', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyToken: jest.fn().mockReturnValue({ userId: '1', sessionId: '1' }),
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  verifyPassword: jest.fn().mockResolvedValue(true),
  validatePasswordStrength: jest.fn().mockReturnValue(true),
  isTokenExpired: jest.fn().mockReturnValue(false)
}));

// Email service mock (uses custom EmailService, not nodemailer)

// Mock sharp for image processing
jest.mock('sharp', () => jest.fn(() => ({
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
  metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 })
})));

// Test database setup
export const mockDb = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  post: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  comment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  server: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  channel: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  analytics: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  userAnalytics: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  vote: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  community: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  }
};

// Mock database
jest.mock('@cryb/database', () => ({
  prisma: mockDb,
  executeWithDatabaseRetry: jest.fn().mockImplementation((fn) => fn()),
  User: {},
  Post: {},
  Comment: {},
  Server: {},
  Channel: {},
  db: mockDb
}));

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockPost = (overrides = {}) => ({
  id: '1',
  title: 'Test Post',
  content: 'Test content',
  authorId: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockServer = (overrides = {}) => ({
  id: '1',
  name: 'Test Server',
  description: 'Test description',
  ownerId: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Test authentication token
export const TEST_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.test';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379/1';