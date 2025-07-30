"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../util/auth");
const handicap_movement_controller_1 = require("../controllers/handicap-movement.controller");
const router = express_1.default.Router();
router.post("/", auth_1.verifyToken, handicap_movement_controller_1.addHandicapMovement);
router.post("/:handicapMovementId/match", auth_1.verifyToken, handicap_movement_controller_1.addMatch);
router.patch("/:handicapMovementId/match/:matchId", auth_1.verifyToken, handicap_movement_controller_1.editMatch);
router.patch("/:handicapMovementId/matches", auth_1.verifyToken, handicap_movement_controller_1.removeMatches);
router.delete("/:handicapMovementId", auth_1.verifyToken, handicap_movement_controller_1.deleteHandicap);
exports.default = router;
