import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { 
  hashPassword, 
  verifyPassword, 
  createSession,
  refreshSession,
  RegisterSchema,
  LoginSchema
} from "@cryb/auth";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/register", async (request, reply) => {
    try {
      const body = RegisterSchema.parse(request.body);
      
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: body.email },
            { username: body.username },
            { walletAddress: body.walletAddress },
          ],
        },
      });

      if (existingUser) {
        return reply.code(400).send({
          success: false,
          error: "User already exists",
        });
      }

      let hashedPassword: string | undefined;
      if (body.password) {
        hashedPassword = await hashPassword(body.password);
      }

      const user = await prisma.user.create({
        data: {
          email: body.email,
          username: body.username,
          displayName: body.displayName,
          walletAddress: body.walletAddress,
        },
      });

      const session = await createSession(user.id, user.email || undefined, user.walletAddress || undefined);

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            walletAddress: user.walletAddress,
          },
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Registration failed",
      });
    }
  });

  fastify.post("/login", async (request, reply) => {
    try {
      const body = LoginSchema.parse(request.body);
      
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: body.email },
            { username: body.username },
            { walletAddress: body.walletAddress },
          ],
        },
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: "Invalid credentials",
        });
      }

      const session = await createSession(user.id, user.email || undefined, user.walletAddress || undefined);

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            walletAddress: user.walletAddress,
            avatar: user.avatar,
          },
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Login failed",
      });
    }
  });

  fastify.post("/refresh", async (request, reply) => {
    try {
      const { refreshToken } = z.object({
        refreshToken: z.string(),
      }).parse(request.body);

      const session = await refreshSession(refreshToken);

      return reply.send({
        success: true,
        data: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(401).send({
        success: false,
        error: "Invalid refresh token",
      });
    }
  });

  fastify.post("/logout", async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");
      
      if (token) {
        await prisma.session.deleteMany({
          where: { token },
        });
      }

      return reply.send({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Logout failed",
      });
    }
  });
};