import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { Server } from "socket.io";
import { createServer } from "http";
import { prisma } from "@cryb/database";
import { setupSocketHandlers } from "./socket";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { serverRoutes } from "./routes/servers";
import { channelRoutes } from "./routes/channels";
import { messageRoutes } from "./routes/messages";
import { web3Routes } from "./routes/web3";
import { logger } from "./utils/logger";

const fastify = Fastify({
  logger: logger,
  trustProxy: true,
});

const httpServer = createServer(fastify.server);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

async function start() {
  try {
    await fastify.register(cors, {
      origin: true,
      credentials: true,
    });

    await fastify.register(helmet, {
      contentSecurityPolicy: false,
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });

    await fastify.register(websocket);

    fastify.decorate("io", io);

    fastify.register(authRoutes, { prefix: "/api/auth" });
    fastify.register(userRoutes, { prefix: "/api/users" });
    fastify.register(serverRoutes, { prefix: "/api/servers" });
    fastify.register(channelRoutes, { prefix: "/api/channels" });
    fastify.register(messageRoutes, { prefix: "/api/messages" });
    fastify.register(web3Routes, { prefix: "/api/web3" });

    setupSocketHandlers(io);

    fastify.get("/", async () => {
      return { status: "ok", message: "CRYB API Server" };
    });

    fastify.get("/health", async () => {
      const dbHealth = await prisma.$queryRaw`SELECT 1`;
      return { 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        database: dbHealth ? "connected" : "disconnected"
      };
    });

    const PORT = process.env.PORT || 3001;
    const HOST = process.env.HOST || "0.0.0.0";

    httpServer.listen(PORT as number, HOST, (err) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      fastify.log.info(`Server listening at http://${HOST}:${PORT}`);
    });

    await fastify.listen({ port: parseInt(PORT as string), host: HOST });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();