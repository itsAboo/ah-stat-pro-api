import express from "express";
import {
  createPost,
  deletePost,
  editPost,
  editPostAccess,
  getMyPosts,
  getPost,
  getPosts,
} from "../controllers/post.controller";
import { verifyToken } from "../util/auth";
import { refreshToken, signout } from "../controllers/user.controller";

const router = express.Router();

router.post("/refresh-token", refreshToken);

router.post("/sign-out", signout);

router.get("/", getPosts);

router.get("/my-posts", verifyToken, getMyPosts);

router.get("/:id", verifyToken, getPost);

router.post("/", verifyToken, createPost);

router.patch("/", verifyToken, editPost);

router.patch("/:id/access", verifyToken, editPostAccess);

router.delete("/:id", verifyToken, deletePost);

export default router;
