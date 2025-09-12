import jwt from "jsonwebtoken";
import { z } from "zod";
import { randomBytes } from "crypto";

// Secure JWT configuration with proper error handling
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('⚠️  Using development JWT secret. Change in production!');
  return randomBytes(64).toString('hex');
})();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m"; // Short-lived access tokens
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";

// Validate JWT secret strength
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long for security');
}

export const TokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().nullable().optional(),
  walletAddress: z.string().nullable().optional(),
  sessionId: z.string(),
  isVerified: z.boolean().optional(),
  jti: z.string().optional(),
  type: z.string().optional(), // for refresh tokens
  iat: z.number().optional(), // issued at
  exp: z.number().optional(), // expires at
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  try {
    // Add required claims for JWT
    const tokenPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    };
    
    return jwt.sign(tokenPayload, JWT_SECRET, {
      algorithm: 'HS256',
      issuer: process.env.JWT_ISSUER || 'cryb-platform',
      audience: process.env.JWT_AUDIENCE || 'cryb-users'
    });
  } catch (error) {
    console.error('Failed to generate access token:', error);
    throw new Error('Token generation failed');
  }
}

export function generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  try {
    // Add required claims for refresh tokens
    const tokenPayload = {
      ...payload,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    };
    
    return jwt.sign(tokenPayload, JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
      issuer: process.env.JWT_ISSUER || 'cryb-platform',
      audience: process.env.JWT_AUDIENCE || 'cryb-users'
    });
  } catch (error) {
    console.error('Failed to generate refresh token:', error);
    throw new Error('Refresh token generation failed');
  }
}

export function verifyToken(token: string, options: { isRefresh?: boolean } = {}): TokenPayload {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Token is required and must be a string');
    }
    
    const secret = options.isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET;
    
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'cryb-platform',
      audience: process.env.JWT_AUDIENCE || 'cryb-users',
      clockTolerance: 30 // 30 seconds clock skew tolerance
    }) as any;
    
    // Validate payload structure
    const validatedPayload = TokenPayloadSchema.parse(decoded);
    
    // Additional validation for refresh tokens
    if (options.isRefresh && validatedPayload.type !== 'refresh') {
      throw new Error('Invalid token type for refresh operation');
    }
    
    // Check token expiration more strictly
    if (validatedPayload.exp && validatedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }
    
    return validatedPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.message.includes('expired')) {
        throw new Error('Token has expired');
      } else if (error.message.includes('invalid signature')) {
        throw new Error('Invalid token signature');
      } else if (error.message.includes('malformed')) {
        throw new Error('Malformed token');
      }
      throw new Error('Invalid token format');
    }
    
    if (error instanceof z.ZodError) {
      console.error('Token payload validation failed:', error.errors);
      throw new Error('Invalid token payload structure');
    }
    
    console.error('Token verification failed:', error);
    throw error instanceof Error ? error : new Error('Token verification failed');
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    const decoded = jwt.decode(token, { complete: false }) as any;
    if (!decoded) {
      return null;
    }
    
    return TokenPayloadSchema.parse(decoded);
  } catch (error) {
    console.warn('Token decoding failed:', error);
    return null;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded?.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const expiration = getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration.getTime() <= Date.now();
  } catch {
    return true;
  }
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenTTL(token: string): number {
  try {
    const expiration = getTokenExpiration(token);
    if (!expiration) {
      return 0;
    }
    const ttl = Math.floor((expiration.getTime() - Date.now()) / 1000);
    return Math.max(0, ttl);
  } catch {
    return 0;
  }
}