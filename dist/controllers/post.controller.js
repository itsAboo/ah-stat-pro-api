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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editPostAccess = exports.editPost = exports.deletePost = exports.createPost = exports.getMyPosts = exports.getPost = exports.getPosts = void 0;
const post_model_1 = __importDefault(require("../models/post.model"));
const validate_1 = require("../util/validate");
const transform_1 = require("../util/transform");
const handicap_movement_model_1 = __importDefault(require("../models/handicap-movement.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const post_access_model_1 = __importDefault(require("../models/post-access.model"));
const getPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const maxPerPage = Number(query.maxPerPage) || 10;
    const page = Number(query.page) || 1;
    if (isNaN(maxPerPage) || maxPerPage <= 0) {
        res.status(400).json({ message: "maxPerPage must be a positive number" });
        return;
    }
    if (isNaN(page) || page <= 0) {
        res.status(400).json({ message: "page must be a positive number" });
        return;
    }
    const skip = (page - 1) * maxPerPage;
    try {
        const postsDoc = yield post_model_1.default.find()
            .skip(skip)
            .limit(maxPerPage)
            .sort({ updatedAt: -1 })
            .populate("userId")
            .populate("handicapMovements");
        const totalPosts = yield post_model_1.default.countDocuments();
        const pageCount = Math.ceil(totalPosts / maxPerPage);
        const posts = postsDoc.map((post) => {
            return (0, transform_1.transformPost)(post.toObject({ virtuals: true }));
        });
        res.status(200).json({
            posts: {
                posts,
                pageCount,
            },
            message: "Successfully fetch posts",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.getPosts = getPosts;
const getPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
        res.status(403).json({ message: "User id is required" });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findOne({
            _id: id,
        })
            .populate("userId")
            .populate("handicapMovements");
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        if (postDoc.access === "private") {
            if (String(postDoc.userId._id) !== userId) {
                const accessiblePostDoc = yield post_access_model_1.default.findOne({
                    userId,
                    postId: id,
                });
                if (!accessiblePostDoc) {
                    res.status(403).json({ message: "Unauthorized to access post" });
                    return;
                }
            }
        }
        const post = (0, transform_1.transformPost)(postDoc.toObject({
            virtuals: true,
        }));
        post.handicapMovements = post.handicapMovements.map((h) => {
            return Object.assign(Object.assign({}, h), { matches: h.matches
                    .map((m, index) => (Object.assign(Object.assign({}, m), { originalIndex: index })))
                    .sort((a, b) => {
                    const timeA = new Date(a.matchDay).getTime();
                    const timeB = new Date(b.matchDay).getTime();
                    if (timeA === timeB) {
                        return b.originalIndex - a.originalIndex;
                    }
                    return timeB - timeA;
                })
                    .map((_a) => {
                    var { originalIndex } = _a, rest = __rest(_a, ["originalIndex"]);
                    return rest;
                }) });
        });
        res.status(200).json({
            message: "Successfully get post",
            post,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.getPost = getPost;
const getMyPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const query = req.query;
    const maxPerPage = Number(query.maxPerPage) || 10;
    const page = Number(query.page) || 1;
    if (isNaN(maxPerPage) || maxPerPage <= 0) {
        res.status(400).json({ message: "maxPerPage must be a positive number" });
        return;
    }
    if (isNaN(page) || page <= 0) {
        res.status(400).json({ message: "page must be a positive number" });
        return;
    }
    const skip = (page - 1) * maxPerPage;
    try {
        const userDoc = yield user_model_1.default.findById(userId);
        if (!userDoc) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        const postsDoc = yield post_model_1.default.find({ userId })
            .populate("handicapMovements")
            .populate("userId")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(maxPerPage);
        const totalPosts = yield post_model_1.default.countDocuments({ userId });
        const pageCount = Math.ceil(totalPosts / maxPerPage);
        let posts = postsDoc.map((post) => (0, transform_1.transformPost)(post.toObject()));
        res.status(200).json({
            message: "Successfully fetch post",
            posts: {
                posts,
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
exports.getMyPosts = getMyPosts;
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, handicapMovements, access } = req.body;
    const userId = req.userId;
    if (!title) {
        res.status(400).json({ message: "title is required" });
        return;
    }
    if (handicapMovements.length > 0) {
        const hasInvalid = handicapMovements.some((handicap) => {
            if (!handicap.start ||
                !handicap.end ||
                !(0, validate_1.isHandicap)(handicap.start) ||
                !(0, validate_1.isHandicap)(handicap.end)) {
                return true;
            }
            if (!handicap.matches || handicap.matches.length === 0) {
                return false;
            }
            return handicap.matches.some((match) => !(0, transform_1.parseDateString)(match.matchDay));
        });
        if (hasInvalid) {
            res.status(400).json({ message: "Some value is invalid" });
            return;
        }
    }
    try {
        const userDoc = yield user_model_1.default.findById(userId);
        if (!userDoc) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const createdPostDoc = yield post_model_1.default.create({
            userId,
            title,
            description,
            handicapMovements: [],
            access,
        });
        yield user_model_1.default.findByIdAndUpdate(userId, {
            $push: { posts: createdPostDoc._id },
        });
        if (handicapMovements && handicapMovements.length > 0) {
            const handicapMovementsToCreate = handicapMovements.map((h) => {
                return Object.assign(Object.assign({}, h), { postId: createdPostDoc._id, matches: Array.isArray(h.matches)
                        ? h.matches.map((m) => (Object.assign(Object.assign({}, m), { matchDay: (0, transform_1.parseDateString)(m.matchDay) })))
                        : [] });
            });
            const createdHandicapMovements = yield handicap_movement_model_1.default.create(handicapMovementsToCreate);
            const createdHMArray = Array.isArray(createdHandicapMovements)
                ? createdHandicapMovements
                : [createdHandicapMovements];
            createdPostDoc.handicapMovements = createdHMArray.map((doc) => doc._id);
            yield createdPostDoc.save();
        }
        res
            .status(200)
            .json({ post: createdPostDoc, message: "Create post success" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.createPost = createPost;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "Post id is required" });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findOne({ _id: id, userId });
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        yield post_model_1.default.findByIdAndDelete(id);
        yield handicap_movement_model_1.default.deleteMany({
            _id: { $in: postDoc.handicapMovements },
        });
        yield user_model_1.default.findOneAndUpdate({ _id: userId }, { $pull: { posts: postDoc._id } });
        res.status(200).json({ message: "Delete post successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.deletePost = deletePost;
const editPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { postId, title, description, access } = req.body;
    console.log(access);
    if (title && title.length < 6) {
        res.status(400).json({ message: "Title must be at least 6 characters" });
        return;
    }
    if (access && access !== "public" && access !== "private") {
        res.status(400).json({ message: "Access must be public or private" });
        return;
    }
    if (!postId) {
        res.status(400).json({ message: "Post id is required" });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findOne({ _id: postId, userId });
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        yield post_model_1.default.findByIdAndUpdate(postId, { title, description, access });
        res.status(200).json({ message: "Updated post successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.editPost = editPost;
const editPostAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { access } = req.body;
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "Post id is required" });
        return;
    }
    if (!access) {
        res
            .status(400)
            .json({ message: "Access and requesterId value are required" });
        return;
    }
    if (access !== "public" && access !== "private") {
        res.status(400).json({ message: "Access has invalid value" });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findOne({ _id: id, userId });
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        postDoc.access = access;
        yield postDoc.save();
        res.status(200).json({ message: "Updated access post successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.editPostAccess = editPostAccess;
