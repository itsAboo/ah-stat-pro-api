import express from "express";
import { verifyToken } from "../util/auth";
import {
  addHandicapMovement,
  addMatch,
  deleteHandicap,
  editMatch,
  removeMatches,
} from "../controllers/handicap-movement.controller";

const router = express.Router();

router.post("/", verifyToken, addHandicapMovement);

router.post("/:handicapMovementId/match", verifyToken, addMatch);

router.patch("/:handicapMovementId/match/:matchId", verifyToken, editMatch);

router.patch("/:handicapMovementId/matches", verifyToken, removeMatches);

router.delete("/:handicapMovementId", verifyToken, deleteHandicap);

export default router;
