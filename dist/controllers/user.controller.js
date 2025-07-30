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
exports.refreshToken = exports.signout = exports.updateName = exports.updatePassword = exports.getUser = exports.signin = exports.signup = void 0;
const validate_1 = require("../util/validate");
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const post_access_model_1 = __importDefault(require("../models/post-access.model"));
const access_request_model_1 = __importDefault(require("../models/access-request.model"));
const auth_1 = require("../util/auth");
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, name } = req.body;
    if (!username || !password) {
        res.status(400).json({ message: "Invalid value" });
        return;
    }
    if (!(0, validate_1.isMinLength)(username, 6) ||
        !(0, validate_1.isMinLength)(password, 6) ||
        (!!name && !(0, validate_1.isMaxLength)(name, 10))) {
        res.status(400).json({ message: "Invalid value" });
        return;
    }
    try {
        const userDoc = yield user_model_1.default.findOne({ username });
        if (userDoc) {
            res.status(400).json({ message: "username already existed" });
            return;
        }
        const newUserDoc = yield user_model_1.default.create({ username, password, name });
        const jwtPayload = {
            id: String(newUserDoc._id),
            username: newUserDoc.username,
        };
        const { accessToken, refreshToken } = (0, auth_1.generateTokens)(jwtPayload);
        const newUser = Object.assign(Object.assign({}, newUserDoc.toObject()), { __v: undefined, password: undefined, _id: undefined, id: newUserDoc._id });
        (0, auth_1.sendRefreshToken)(res, refreshToken);
        res.status(200).json({
            message: "Create user successfully",
            token: accessToken,
            user: newUser,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
        return;
    }
});
exports.signup = signup;
const signin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ message: "Invalid value" });
        return;
    }
    if (!(0, validate_1.isMinLength)(username, 6) || !(0, validate_1.isMinLength)(password, 6)) {
        res.status(400).json({ message: "Invalid value" });
        return;
    }
    try {
        const userDoc = yield user_model_1.default.findOne({ username });
        if (!userDoc) {
            res.status(400).json({ message: "username or password is invalid" });
            return;
        }
        const isPwMatch = yield bcrypt_1.default.compare(password, userDoc.password);
        if (!isPwMatch) {
            res.status(400).json({ message: "username or password is invalid" });
            return;
        }
        const jwtPayload = {
            id: String(userDoc._id),
            username: userDoc.username,
        };
        const { accessToken, refreshToken } = (0, auth_1.generateTokens)(jwtPayload);
        const user = Object.assign(Object.assign({}, userDoc.toObject()), { __v: undefined, password: undefined, _id: undefined, id: userDoc._id });
        (0, auth_1.sendRefreshToken)(res, refreshToken);
        res
            .status(200)
            .json({ message: "Sign in successfully", token: accessToken, user });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
        return;
    }
});
exports.signin = signin;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        const userDoc = yield user_model_1.default.findById(userId);
        if (!userDoc) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const accessiblePostDoc = yield post_access_model_1.default.find({ userId });
        const accessRequestDoc = yield access_request_model_1.default.find({ requesterId: userId });
        const user = {
            id: userDoc._id,
            username: userDoc.username,
            role: userDoc.role,
            posts: userDoc.posts,
            name: userDoc.name,
            accessiblePostIds: accessiblePostDoc.map((e) => ({ postId: e.postId })),
            accessRequest: accessRequestDoc.map((e) => ({
                postId: e.postId,
                status: e.status,
            })),
        };
        res.status(200).json({ message: "Success", user });
    }
    catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
        return;
    }
});
exports.getUser = getUser;
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
        res.status(400).json({
            message: "Old password, new password, and confirm password are required",
        });
        return;
    }
    if (!(0, validate_1.isMinLength)(oldPassword, 6) ||
        !(0, validate_1.isMinLength)(newPassword, 6) ||
        !(0, validate_1.isMinLength)(confirmPassword, 6)) {
        res.status(400).json({ message: "Password must be at least 6 characters" });
        return;
    }
    if (newPassword !== confirmPassword) {
        res.status(400).json({
            newPassword: "New password and confirm password do not match",
            confirmPassword: "New password and confirm password do not match",
        });
        return;
    }
    try {
        const userId = req.userId;
        const userDoc = yield user_model_1.default.findById(userId);
        if (!userDoc) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const isOldPasswordValid = yield bcrypt_1.default.compare(oldPassword, userDoc.password);
        if (!isOldPasswordValid) {
            res.status(400).json({ oldPassword: "Current password is incorrect" });
            return;
        }
        const isSamePassword = yield bcrypt_1.default.compare(newPassword, userDoc.password);
        if (isSamePassword) {
            res.status(400).json({
                newPassword: "New password must be different from current password",
            });
            return;
        }
        const hashedNewPassword = yield bcrypt_1.default.hash(newPassword, 12);
        yield user_model_1.default.findByIdAndUpdate(userId, {
            password: hashedNewPassword,
        });
        res.status(200).json({ message: "Password updated successfully" });
    }
    catch (error) {
        console.error("Update password error", error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
        return;
    }
});
exports.updatePassword = updatePassword;
const updateName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: "Name is require to update" });
        return;
    }
    try {
        const userDoc = yield user_model_1.default.findById(userId);
        if (!userDoc) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        userDoc.name = name;
        yield userDoc.save();
        res.status(200).json({ message: "Updated name successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.updateName = updateName;
const signout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
    });
    res.status(200).json({ message: "Sign out successfully" });
});
exports.signout = signout;
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(401).json({ message: "Refresh token is required" });
        return;
    }
    try {
        const decodedToken = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        const { accessToken, refreshToken: newRefreshToken } = (0, auth_1.generateTokens)(decodedToken);
        (0, auth_1.sendRefreshToken)(res, newRefreshToken);
        res.status(200).json({ token: accessToken });
    }
    catch (error) {
        console.log(error);
        res.status(403).json({ message: "Invalid or expired refresh token" });
    }
});
exports.refreshToken = refreshToken;
