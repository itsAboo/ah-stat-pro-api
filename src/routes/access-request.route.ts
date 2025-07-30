import express from "express";
import { verifyToken } from "../util/auth";
import {
  createAccessRequest,
  getAccessesRequest,
  rejectAccessRequest,
} from "../controllers/access-request.controller";

const router = express.Router();

router.post("/", verifyToken, createAccessRequest);

router.get("/", verifyToken, getAccessesRequest);

router.patch("/:id/reject", verifyToken, rejectAccessRequest);

export default router;
