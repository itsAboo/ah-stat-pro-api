"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    recipientId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    senderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["access_request", "access_approved", "access_rejected"],
        required: true,
    },
    message: {
        type: String,
        trim: true,
    },
    post: {
        id: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Post",
        },
        title: String,
    },
    accessRequestId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "AccessRequest",
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
const Notification = mongoose_1.default.model("Notification", notificationSchema);
exports.default = Notification;
