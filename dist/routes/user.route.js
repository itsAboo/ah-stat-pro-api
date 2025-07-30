"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../util/auth");
const router = express_1.default.Router();
router.post("/signup", user_controller_1.signup);
router.post("/signin", user_controller_1.signin);
router.post("/refresh-token", user_controller_1.refreshToken);
router.post("/signout", user_controller_1.signout);
router.patch("/password", auth_1.verifyToken, user_controller_1.updatePassword);
router.patch("/name", auth_1.verifyToken, user_controller_1.updateName);
router.get("/", auth_1.verifyToken, user_controller_1.getUser);
exports.default = router;
