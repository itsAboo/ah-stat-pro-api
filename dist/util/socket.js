"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const onlineUsers = new Map();
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.ORIGIN,
            methods: ["GET", "POST"],
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.userId = payload.id;
            next();
        }
        catch (error) {
            next(new Error("Invalid token"));
        }
    });
    io.on("connection", (socket) => {
        const userId = socket.userId;
        if (!userId)
            return;
        onlineUsers.set(userId, socket.id);
        socket.on("disconnect", () => {
            var _a;
            const disconnectedUser = (_a = [...onlineUsers.entries()].find(([_, socketId]) => socketId === socket.id)) === null || _a === void 0 ? void 0 : _a[0];
            if (disconnectedUser) {
                onlineUsers.delete(disconnectedUser);
            }
        });
    });
};
exports.initSocket = initSocket;
const sendNotification = (recipientId, data) => {
    const socketId = onlineUsers.get(recipientId);
    if (socketId && io) {
        io.to(socketId).emit("notification", data);
        console.log(`📨 Sent notification to ${recipientId}`);
    }
};
exports.sendNotification = sendNotification;
