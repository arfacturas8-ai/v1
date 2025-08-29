// Server Configuration with Timeout Settings
export const serverConfig = {
  // Server timeouts
  timeout: {
    keepAlive: 120000,     // 2 minutes
    requestTimeout: 600000, // 10 minutes for long operations
    connectionTimeout: 30000,
    socketTimeout: 600000,
  },
  
  // Fastify settings
  fastify: {
    bodyLimit: 52428800, // 50MB
    trustProxy: true,
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      prettyPrint: process.env.NODE_ENV === 'development'
    },
    connectionTimeout: 600000,
    keepAliveTimeout: 120000,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
  },
  
  // Socket.io settings
  socketIO: {
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e8, // 100MB
    transports: ['websocket', 'polling'],
    cors: {
      origin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
      credentials: true
    }
  },
  
  // Database pool settings
  database: {
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 600000,
    max: 20,
    min: 2,
    statement_timeout: 300000, // 5 minutes
  },
  
  // Redis settings
  redis: {
    connectTimeout: 30000,
    commandTimeout: 10000,
    keepAlive: 30000,
    retryStrategy: (times: number) => {
      if (times > 3) return null;
      return Math.min(times * 100, 3000);
    }
  }
};