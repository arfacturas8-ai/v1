export * from "@prisma/client";
export { PrismaClient } from "@prisma/client";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma configuration with connection pooling and error handling
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn", "info"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://cryb_user:cryb_strong_password@localhost:5433/cryb_development'
      }
    },
    // Connection pool configuration for better reliability
    transactionOptions: {
      maxWait: 10000, // 10 seconds
      timeout: 30000, // 30 seconds
    }
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Connection health check and retry logic
export async function ensureDatabaseConnection(maxRetries: number = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection healthy');
      return true;
    } catch (error) {
      console.warn(`Database connection attempt ${attempt}/${maxRetries} failed:`, error instanceof Error ? error.message : error);
      
      if (attempt === maxRetries) {
        console.error('❌ Database connection failed after all retry attempts');
        return false;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Database operation with retry logic
export async function executeWithDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown database error');
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      
      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }
      
      console.warn(`Database operation retry ${attempt}/${maxRetries}:`, lastError.message);
      
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      const jitter = Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
    }
  }
  
  throw lastError!;
}

// Determine if database error is retryable
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code;
  
  // Connection-related errors that are retryable
  const retryableMessages = [
    'connection terminated',
    'connection refused',
    'connection reset',
    'timeout',
    'network error',
    'connection lost',
    'server has gone away',
    'connection pool exhausted'
  ];
  
  const retryableCodes = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
    'P1001', // Prisma connection error
    'P1008', // Operations timed out
    'P1017'  // Server has closed the connection
  ];
  
  return retryableMessages.some(msg => errorMessage.includes(msg)) ||
         retryableCodes.includes(errorCode);
}

// Graceful shutdown handler
export async function gracefulDatabaseShutdown(): Promise<void> {
  try {
    console.log('Shutting down database connection...');
    await prisma.$disconnect();
    console.log('✅ Database connection closed gracefully');
  } catch (error) {
    console.error('Error during database shutdown:', error);
  }
}