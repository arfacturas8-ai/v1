import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";

export const TokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().optional(),
  walletAddress: z.string().optional(),
  sessionId: z.string(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return TokenPayloadSchema.parse(decoded);
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as any;
    return TokenPayloadSchema.parse(decoded);
  } catch {
    return null;
  }
}