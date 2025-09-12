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
});

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