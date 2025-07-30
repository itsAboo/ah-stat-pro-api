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
exports.clearRefreshToken = exports.sendRefreshToken = exports.generateTokens = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.headers.authorization) {
        res.status(401).json({ message: "Authorization token is required" });
        return;
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        (0, exports.clearRefreshToken)(res);
        res.status(401).json({ message: "Access token is missing or invalid" });
        return;
    }
    try {
        const decodedToken = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decodedToken.id;
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
    }
});
exports.verifyToken = verifyToken;
const generateTokens = (payload) => {
    const { exp, iat } = payload, cleanPayload = __rest(payload, ["exp", "iat"]);
    const accessToken = jsonwebtoken_1.default.sign(cleanPayload, JWT_SECRET, { expiresIn: "10m" });
    const refreshToken = jsonwebtoken_1.default.sign(cleanPayload, JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const sendRefreshToken = (res, refreshToken) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};
exports.sendRefreshToken = sendRefreshToken;
const clearRefreshToken = (res) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};
exports.clearRefreshToken = clearRefreshToken;
