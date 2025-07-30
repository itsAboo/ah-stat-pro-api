"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.getNotifications = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const query = req.query;
    const maxPerPage = Number(query.maxPerPage);
    const page = Number(query.page) || 1;
    if ((maxPerPage && (isNaN(maxPerPage) || maxPerPage < 0)) ||
        (page && isNaN(page) && page < 0)) {
        res.status(400).json({ message: "Page and maxPerPage must be a number" });
        return;
    }
    let transformedNotifications = [];
    const skip = (Number(page) - 1) * Number(maxPerPage) || 0;
    try {
        const notificationsDoc = yield notification_model_1.default.find({ recipientId: userId })
            .populate("senderId")
            .populate("accessRequestId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(maxPerPage);
        if (notificationsDoc.length > 0) {
            transformedNotifications = notificationsDoc.map((n) => (Object.assign(Object.assign({}, n.toObject()), { _id: undefined, accessRequestId: undefined, senderId: undefined, postId: undefined, id: n._id, sender: n.senderId.name || n.senderId.username, createdAt: n.createdAt, message: n.message, source: {
                    post: {
                        id: String(n.post.id),
                        title: n.post.title,
                    },
                }, type: n.type, accessRequest: {
                    id: n.accessRequestId._id,
                    postId: n.accessRequestId.postId,
                    requesterId: n.accessRequestId.requesterId,
                    receiverId: n.accessRequestId.receiverId,
                    status: n.accessRequestId.status,
                } })));
        }
        const totalNotification = yield notification_model_1.default.countDocuments({
            recipientId: userId,
        });
        const pageCount = Math.ceil(totalNotification / maxPerPage);
        res.status(200).json({
            message: "Successfully fetch notifications",
            notifications: {
                notifications: transformedNotifications,
                pageCount,
            },
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.getNotifications = getNotifications;
const markAllNotificationsAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        yield notification_model_1.default.updateMany({
            recipientId: userId,
            isRead: false,
        }, { $set: { isRead: true } });
        res.status(200).json({ message: "All notifications marked as read" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
