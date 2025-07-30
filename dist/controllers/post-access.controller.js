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
exports.getPostAccessAccepted = exports.deletePostAccess = exports.createPostAccess = exports.getPostAccesses = void 0;
const post_model_1 = __importDefault(require("../models/post.model"));
const post_access_model_1 = __importDefault(require("../models/post-access.model"));
const socket_1 = require("../util/socket");
const access_request_model_1 = __importDefault(require("../models/access-request.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const getPostAccesses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        const postAccessesDoc = yield post_access_model_1.default.find({ userId });
        res.status(200).json({
            message: "Successfully fetch post accesses",
            postAccesses: postAccessesDoc,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.getPostAccesses = getPostAccesses;
// submit access
const createPostAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { postId, requesterId, accessRequestId } = req.body;
    if (!postId) {
        res.status(400).json({ message: "Post id is required" });
        return;
    }
    if (!requesterId) {
        res.status(400).json({ message: "Requester id is required" });
        return;
    }
    if (!accessRequestId) {
        res.status(400).json({ message: "Access request id is required" });
        return;
    }
    if (userId === requesterId) {
        res
            .status(400)
            .json({ message: "You cannot create access to your own post" });
        return;
    }
    try {
        const existingAccess = yield post_access_model_1.default.findOne({
            postId,
            userId: requesterId,
        });
        if (existingAccess) {
            res.status(400).json({ message: "Access already granted to this user" });
            return;
        }
        const userDoc = yield user_model_1.default.findById(userId);
        if (!userDoc) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const postDoc = yield post_model_1.default.findById(postId);
        if (!postDoc) {
            yield access_request_model_1.default.findOneAndDelete({ _id: accessRequestId });
            yield notification_model_1.default.findOneAndDelete({ accessRequestId });
            res.status(200).json({ message: "Post has been removed" });
            return;
        }
        const addedPostAccessDoc = yield post_access_model_1.default.create({
            postId,
            userId: requesterId,
            grantedBy: userId,
        });
        const accessRequestDoc = yield access_request_model_1.default.findOne({
            postId,
            _id: accessRequestId,
        });
        if (!accessRequestDoc) {
            res.status(404).json({ message: "Access request not found" });
            return;
        }
        accessRequestDoc.status = "approved";
        yield accessRequestDoc.save();
        const notificationCreatedDoc = yield notification_model_1.default.create({
            senderId: userDoc._id,
            recipientId: requesterId,
            type: "access_approved",
            message: `Your access request to the post has been approved by ${userDoc.name || userDoc.username}`,
            accessRequestId: accessRequestDoc._id,
            post: {
                id: postDoc._id,
                title: postDoc.title,
            },
        });
        const notificationData = {
            id: notificationCreatedDoc._id,
            sender: userDoc.name || userDoc.username,
            createdAt: new Date(),
            source: {
                post: {
                    id: postDoc._id,
                    title: postDoc.title,
                },
            },
            message: notificationCreatedDoc.message,
            type: "access_approved",
            accessRequestId: accessRequestDoc._id,
            recipientId: requesterId,
        };
        (0, socket_1.sendNotification)(requesterId, notificationData);
        res.status(200).json({
            message: "Successfully added post access",
            postAccess: addedPostAccessDoc,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.createPostAccess = createPostAccess;
const deletePostAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { postAccessIds } = req.body;
    if (!postAccessIds) {
        res.status(400).json({ message: "Post access id is required" });
        return;
    }
    const ids = Array.isArray(postAccessIds)
        ? postAccessIds
        : postAccessIds.split(",");
    try {
        const postAccess = yield post_access_model_1.default.find({
            _id: postAccessIds,
            grantedBy: userId,
        });
        if (!postAccess || postAccess.length === 0) {
            res.status(404).json({ message: "Access not found" });
            return;
        }
        const deleted = yield post_access_model_1.default.deleteMany({
            _id: { $in: ids },
            grantedBy: userId,
        });
        if (deleted.deletedCount === 0) {
            res.status(404).json({ message: "No matching post access found" });
            return;
        }
        const requesterIds = postAccess.map((pa) => pa.userId);
        yield access_request_model_1.default.updateMany({
            requesterId: { $in: requesterIds },
        }, { $set: { status: "rejected" } });
        res.status(200).json({ message: "Deleted post access successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.deletePostAccess = deletePostAccess;
const getPostAccessAccepted = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { postId } = req.params;
    if (!postId) {
        res.status(400).json({ message: "Post id is required" });
        return;
    }
    try {
        const postAccessDoc = yield post_access_model_1.default.find({
            grantedBy: userId,
            postId,
        }).populate("userId");
        if (!postAccessDoc) {
            res.status(404).json({ message: "Access not found" });
            return;
        }
        const postAccessAccepted = postAccessDoc.map((postAccess) => {
            return {
                id: postAccess._id,
                name: postAccess.userId.name || postAccess.userId.username,
                approvedAt: postAccess.userId.updatedAt,
            };
        });
        res.status(200).json({
            message: "Successfully fetch post accesses",
            postAccessAccepted: postAccessAccepted,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.getPostAccessAccepted = getPostAccessAccepted;
