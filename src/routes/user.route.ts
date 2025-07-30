import express from "express";
import {
  getUser,
  refreshToken,
  signin,
  signout,
  signup,
  updateName,
  updatePassword,
} from "../controllers/user.controller";
import { verifyToken } from "../util/auth";

const router = express.Router();

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/refresh-token", refreshToken);

router.post("/signout", signout);

router.patch("/password", verifyToken, updatePassword);

router.patch("/name", verifyToken, updateName);

router.get("/", verifyToken, getUser);

export default router;
