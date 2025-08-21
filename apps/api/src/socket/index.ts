import { Server, Socket } from "socket.io";
import { verifyToken } from "@cryb/auth";
import { prisma } from "@cryb/database";
import { logger } from "../utils/logger";

interface SocketWithAuth extends Socket {
  userId?: string;
  username?: string;
}

export function setupSocketHandlers(io: Server) {
  io.use(async (socket: SocketWithAuth, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user.id;
      socket.username = user.username;
      next();
    } catch (error) {
      logger.error("Socket authentication error:", error);
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: SocketWithAuth) => {
    logger.info(`User ${socket.username} connected`);

    socket.on("join-server", async (serverId: string) => {
      try {
        const member = await prisma.serverMember.findUnique({
          where: {
            serverId_userId: {
              serverId,
              userId: socket.userId!,
            },
          },
        });

        if (member) {
          socket.join(`server-${serverId}`);
          socket.emit("joined-server", serverId);
          logger.info(`User ${socket.username} joined server ${serverId}`);
        } else {
          socket.emit("error", "Not a member of this server");
        }
      } catch (error) {
        logger.error("Error joining server:", error);
        socket.emit("error", "Failed to join server");
      }
    });

    socket.on("leave-server", (serverId: string) => {
      socket.leave(`server-${serverId}`);
      socket.emit("left-server", serverId);
      logger.info(`User ${socket.username} left server ${serverId}`);
    });

    socket.on("join-channel", async (channelId: string) => {
      try {
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { server: true },
        });

        if (!channel) {
          return socket.emit("error", "Channel not found");
        }

        const member = await prisma.serverMember.findUnique({
          where: {
            serverId_userId: {
              serverId: channel.serverId,
              userId: socket.userId!,
            },
          },
        });

        if (member) {
          socket.join(`channel-${channelId}`);
          socket.emit("joined-channel", channelId);
          logger.info(`User ${socket.username} joined channel ${channelId}`);
        } else {
          socket.emit("error", "Not authorized to join this channel");
        }
      } catch (error) {
        logger.error("Error joining channel:", error);
        socket.emit("error", "Failed to join channel");
      }
    });

    socket.on("leave-channel", (channelId: string) => {
      socket.leave(`channel-${channelId}`);
      socket.emit("left-channel", channelId);
      logger.info(`User ${socket.username} left channel ${channelId}`);
    });

    socket.on("send-message", async (data: {
      channelId: string;
      content: string;
      replyToId?: string;
    }) => {
      try {
        const message = await prisma.message.create({
          data: {
            channelId: data.channelId,
            userId: socket.userId!,
            content: data.content,
            replyToId: data.replyToId,
          },
          include: {
            user: true,
            replyTo: {
              include: {
                user: true,
              },
            },
          },
        });

        io.to(`channel-${data.channelId}`).emit("new-message", message);
        logger.info(`Message sent in channel ${data.channelId} by ${socket.username}`);
      } catch (error) {
        logger.error("Error sending message:", error);
        socket.emit("error", "Failed to send message");
      }
    });

    socket.on("typing", (data: { channelId: string }) => {
      socket.to(`channel-${data.channelId}`).emit("user-typing", {
        userId: socket.userId,
        username: socket.username,
        channelId: data.channelId,
      });
    });

    socket.on("stop-typing", (data: { channelId: string }) => {
      socket.to(`channel-${data.channelId}`).emit("user-stop-typing", {
        userId: socket.userId,
        channelId: data.channelId,
      });
    });

    socket.on("update-status", async (status: string) => {
      try {
        socket.broadcast.emit("user-status-update", {
          userId: socket.userId,
          status,
        });
        logger.info(`User ${socket.username} status updated to ${status}`);
      } catch (error) {
        logger.error("Error updating status:", error);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`User ${socket.username} disconnected`);
      socket.broadcast.emit("user-offline", socket.userId);
    });
  });
}