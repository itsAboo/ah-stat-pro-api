import express from "express";
import { verifyToken } from "../util/auth";
import {
  createPostAccess,
  deletePostAccess,
  getPostAccessAccepted,
  getPostAccesses,
} from "../controllers/post-access.controller";

const router = express.Router();

router.get("/", verifyToken, getPostAccesses);

router.post("/delete-many", verifyToken, deletePostAccess);

router.get("/accepted/:postId", verifyToken, getPostAccessAccepted);

router.post("/", verifyToken, createPostAccess);

export default router;
