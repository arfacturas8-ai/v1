import { prisma } from "@cryb/database";
import { generateAccessToken, generateRefreshToken, verifyToken, TokenPayload } from "./jwt";
import crypto from "crypto";

export async function createSession(userId: string, email?: string, walletAddress?: string) {
  const sessionId = crypto.randomUUID();
  
  const payload: TokenPayload = {
    userId,
    email,
    walletAddress,
    sessionId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const session = await prisma.session.create({
    data: {
      userId,
      token: accessToken,
      refreshToken,
      expiresAt,
    },
  });

  return {
    session,
    accessToken,
    refreshToken,
  };
}

export async function validateSession(token: string) {
  try {
    const payload = verifyToken(token);
    
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new Error("Session expired");
    }

    return {
      session,
      user: session.user,
    };
  } catch (error) {
    throw new Error("Invalid session");
  }
}

export async function refreshSession(refreshToken: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new Error("Invalid refresh token");
  }

  const payload: TokenPayload = {
    userId: session.userId,
    email: session.user.email || undefined,
    walletAddress: session.user.walletAddress || undefined,
    sessionId: session.id,
  };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    session: updatedSession,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function destroySession(token: string) {
  await prisma.session.delete({
    where: { token },
  });
}