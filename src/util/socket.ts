import { Server as SocketIOServer } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

declare module "socket.io" {
  interface Socket {
    userId?: string;
  }
}

const onlineUsers = new Map<string, string>();
let io: SocketIOServer;

interface JWTPayload {
  id: string;
}

export const initSocket = (server: http.Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:5173", 
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JWTPayload;

      socket.userId = payload.id;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    if (!userId) return;

    onlineUsers.set(userId, socket.id);

    socket.on("disconnect", () => {
      const disconnectedUser = [...onlineUsers.entries()].find(
        ([_, socketId]) => socketId === socket.id
      )?.[0];

      if (disconnectedUser) {
        onlineUsers.delete(disconnectedUser);
      }
    });
  });
};

export const sendNotification = (recipientId: string, data: any) => {
  const socketId = onlineUsers.get(recipientId);
  if (socketId && io) {
    io.to(socketId).emit("notification", data);
    console.log(`📨 Sent notification to ${recipientId}`);
  } 
};
