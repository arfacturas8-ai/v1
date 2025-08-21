import { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "@cryb/auth";
import { prisma } from "@cryb/database";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return reply.code(401).send({
        success: false,
        error: "Authentication required",
      });
    }

    const payload = verifyToken(token);
    
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return reply.code(401).send({
        success: false,
        error: "Session expired",
      });
    }

    (request as any).userId = session.userId;
    (request as any).user = session.user;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: "Invalid token",
    });
  }
}