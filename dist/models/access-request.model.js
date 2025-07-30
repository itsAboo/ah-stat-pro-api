"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const accessRequestSchema = new mongoose_1.default.Schema({
    postId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    requesterId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    receiverId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
}, { timestamps: true });
const AccessRequest = mongoose_1.default.model("AccessRequest", accessRequestSchema);
exports.default = AccessRequest;
