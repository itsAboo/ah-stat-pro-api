"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const postSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    handicapMovements: {
        type: [
            {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "HandicapMovement",
            },
        ],
        default: [],
    },
    access: {
        type: String,
        enum: ["public", "private"],
        default: "public",
    },
}, { timestamps: true });
const Post = mongoose_1.default.model("Post", postSchema);
exports.default = Post;
