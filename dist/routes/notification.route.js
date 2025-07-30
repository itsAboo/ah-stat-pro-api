"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("../controllers/notification.controller");
const auth_1 = require("../util/auth");
const router = express_1.default.Router();
router.get("/", auth_1.verifyToken, notification_controller_1.getNotifications);
router.patch("/mark-all-read", auth_1.verifyToken, notification_controller_1.markAllNotificationsAsRead);
exports.default = router;
