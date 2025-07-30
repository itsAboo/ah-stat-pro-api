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
exports.rejectAccessRequest = exports.createAccessRequest = exports.getAccessesRequest = void 0;
const access_request_model_1 = __importDefault(require("../models/access-request.model"));
const socket_1 = require("../util/socket");
const post_model_1 = __importDefault(require("../models/post.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const getAccessesRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        const accessRequestDoc = yield access_request_model_1.default.find({
            $or: [{ requesterId: userId }, { receiverId: userId }],
        });
        if (!accessRequestDoc) {
            res.status(404).json({ message: "Access request not found" });
            return;
        }
        const transformedAccessRequest = accessRequestDoc.map((a) => (Object.assign({ id: a._id }, a.toObject())));
        res.status(200).json({
            message: "Successfully fetch access request",
            accessRequest: transformedAccessRequest,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.getAccessesRequest = getAccessesRequest;
//send request
const createAccessRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { postId } = req.body;
    if (!postId) {
        res.status(400).json({ message: "Post id is required" });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findById(postId);
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        if (String(postDoc.userId) === userId) {
            res
                .status(400)
                .json({ message: "You cannot request access to your own post" });
            return;
        }
        const existingRequest = yield access_request_model_1.default.findOne({
            postId,
            requesterId: userId,
            status: { $in: ["pending", "approved"] },
        });
        if (existingRequest) {
            if (existingRequest.status === "pending") {
                res
                    .status(400)
                    .json({ message: "You already have a pending access request" });
                return;
            }
            if (existingRequest.status === "approved") {
                res.status(400).json({ message: "Access has already been granted" });
                return;
            }
        }
        const requesterDoc = yield user_model_1.default.findById(userId);
        if (!requesterDoc) {
            res.status(404).json({ message: "User is invalid" });
            return;
        }
        const ownerPostDoc = yield user_model_1.default.findById(postDoc.userId);
        if (!ownerPostDoc) {
            res.status(404).json({ message: "Owner post account not found" });
            return;
        }
        const recipientId = String(postDoc.userId);
        const accessRequestDoc = yield access_request_model_1.default.create({
            postId,
            requesterId: userId,
            receiverId: postDoc.userId,
        });
        const notificationCreatedDoc = yield notification_model_1.default.create({
            senderId: requesterDoc._id,
            recipientId: ownerPostDoc._id,
            isRead: false,
            type: "access_request",
            message: `${requesterDoc.name || requesterDoc.username} has requested access to your post`,
            accessRequestId: accessRequestDoc._id,
            post: {
                id: postDoc._id,
                title: postDoc.title,
            },
        });
        const notificationData = {
            id: notificationCreatedDoc._id,
            sender: requesterDoc.name || requesterDoc.username,
            createdAt: new Date(),
            source: {
                post: {
                    id: postDoc._id,
                    title: postDoc.title,
                },
            },
            message: notificationCreatedDoc.message,
            type: "access_request",
            accessRequestId: accessRequestDoc._id,
            accessRequest: Object.assign({ id: accessRequestDoc._id }, accessRequestDoc.toObject()),
        };
        (0, socket_1.sendNotification)(recipientId, notificationData);
        res.status(200).json({
            message: "Successfully created access request",
            accessRequest: accessRequestDoc,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.createAccessRequest = createAccessRequest;
const rejectAccessRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "Access request id is required" });
        return;
    }
    try {
        const accessRequestDoc = yield access_request_model_1.default.findOne({
            _id: id,
            receiverId: userId,
        });
        if (!accessRequestDoc) {
            res.status(404).json({ message: "Access request not found" });
            return;
        }
        if (accessRequestDoc.status !== "pending") {
            res.status(400).json({ message: "Access request already handled" });
            return;
        }
        accessRequestDoc.status = "rejected";
        yield accessRequestDoc.save();
        res.status(200).json({ message: "Access request has been rejected" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.rejectAccessRequest = rejectAccessRequest;
