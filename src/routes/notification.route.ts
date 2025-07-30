import express from "express";
import {
  getNotifications,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller";
import { verifyToken } from "../util/auth";

const router = express.Router();

router.get("/", verifyToken, getNotifications);

router.patch("/mark-all-read", verifyToken, markAllNotificationsAsRead);

export default router;
